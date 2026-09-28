(function () {
    'use strict';

    const DEFAULT_WORKER_URL =
        'https://school-r2-files.ngogibao0311.workers.dev';

    const R2_CONFIG = Object.freeze({
        workerUrl: String(
            window.R2_WORKER_URL ||
            window.APP_STORAGE_CONFIG?.r2WorkerUrl ||
            DEFAULT_WORKER_URL
        ).replace(/\/+$/, ''),

        defaultMaxFileSize:
            5 * 1024 * 1024
    });

    function isConfigured() {
        return Boolean(
            R2_CONFIG.workerUrl &&
            !R2_CONFIG.workerUrl.includes(
                'YOUR-R2-WORKER'
            )
        );
    }

    function normalizeFolder(value) {
        return String(value || 'files')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9/_-]+/g, '-')
            .replace(/\/{2,}/g, '/')
            .replace(/^\/+|\/+$/g, '') ||
            'files';
    }

    const FILE_TYPE_BY_EXTENSION = Object.freeze({
        mp3: 'audio/mpeg',
        wav: 'audio/wav',
        m4a: 'audio/mp4',
        aac: 'audio/aac',
        ogg: 'audio/ogg',
        oga: 'audio/ogg',
        opus: 'audio/ogg',
        flac: 'audio/flac',
        webm: 'audio/webm'
    });

    function inferUploadContentType(file, fileName) {
        const providedType = String(
            file?.type || ''
        ).trim();

        if (
            providedType &&
            providedType !== 'application/octet-stream'
        ) {
            return providedType;
        }

        const extension = String(fileName || '')
            .split(/[?#]/)[0]
            .split('.')
            .pop()
            .toLowerCase();

        return (
            FILE_TYPE_BY_EXTENSION[extension] ||
            providedType ||
            'application/octet-stream'
        );
    }

    async function getFirebaseUser() {
        if (
            typeof firebase === 'undefined' ||
            typeof firebase.auth !== 'function'
        ) {
            throw new Error(
                'Firebase Auth chưa được nạp.'
            );
        }

        const auth = firebase.auth();

        if (auth.currentUser) {
            return auth.currentUser;
        }

        return new Promise((resolve, reject) => {
            let settled = false;
            let unsubscribe = () => { };

            const timer = setTimeout(() => {
                if (settled) return;

                settled = true;
                unsubscribe();

                reject(
                    new Error(
                        'Phiên đăng nhập Firebase đã hết hạn. ' +
                        'Vui lòng đăng nhập lại.'
                    )
                );
            }, 8000);

            unsubscribe =
                auth.onAuthStateChanged(user => {
                    if (settled) return;

                    settled = true;
                    clearTimeout(timer);
                    unsubscribe();

                    if (!user) {
                        reject(
                            new Error(
                                'Bạn chưa đăng nhập Firebase Auth.'
                            )
                        );

                        return;
                    }

                    resolve(user);
                });
        });
    }

    async function getIdToken() {
        const user = await getFirebaseUser();

        return user.getIdToken();
    }

    function getErrorMessage(result, response) {
        return (
            result?.error ||
            result?.message ||
            `Cloudflare R2 trả về lỗi HTTP ` +
            `${response.status}.`
        );
    }

    async function uploadFile(
        file,
        options = {}
    ) {
        if (!(file instanceof Blob)) {
            throw new Error(
                'Dữ liệu tải lên không phải File hoặc Blob.'
            );
        }

        if (!isConfigured()) {
            throw new Error(
                'Chưa cấu hình R2_WORKER_URL. ' +
                'Hãy thay URL Worker trong HTML hoặc ' +
                'cloudflare-r2-storage.js.'
            );
        }

        const originalName =
            options.fileName ||
            file.name ||
            `file-${Date.now()}`;

        const inferredContentType =
            inferUploadContentType(
                file,
                originalName
            );

        /*
         * Nhận diện audio bằng CẢ MIME và phần mở rộng.
         *
         * Một số trình duyệt/thiết bị có thể báo:
         * - .m4a  -> video/mp4
         * - .webm -> video/webm
         * - hoặc MIME không chuẩn
         *
         * Nếu chỉ kiểm tra audio/* thì các file này bị hiểu
         * nhầm là file thường và rơi về giới hạn maxSizeBytes
         * (ví dụ 10 MB phía học sinh).
         */
        const audioExtension =
            String(originalName || '')
                .split(/[?#]/)[0]
                .split('.')
                .pop()
                .toLowerCase();

        const isAudioFile =
            String(inferredContentType || '')
                .toLowerCase()
                .startsWith('audio/') ||
            Object.prototype.hasOwnProperty.call(
                FILE_TYPE_BY_EXTENSION,
                audioExtension
            );

        const maxSizeBytes =
            isAudioFile
                ? (
                    Number(options.audioMaxSizeBytes) ||
                    Number(options.maxSizeBytes) ||
                    R2_CONFIG.defaultMaxFileSize
                )
                : (
                    Number(options.maxSizeBytes) ||
                    R2_CONFIG.defaultMaxFileSize
                );

        if (file.size > maxSizeBytes) {
            const maxMB =
                maxSizeBytes / (1024 * 1024);

            throw new Error(
                `File vượt giới hạn ` +
                `${maxMB.toFixed(0)} MB.`
            );
        }

        /*
         * Một số trình duyệt trả file.type rỗng,
         * đặc biệt với M4A hoặc một số file MP3.
         */
        const uploadPayload =
            inferredContentType !==
                'application/octet-stream' &&
                (
                    !file.type ||
                    file.type ===
                    'application/octet-stream'
                )
                ? new Blob(
                    [file],
                    { type: inferredContentType }
                )
                : file;

        const token = await getIdToken();
        const formData = new FormData();

        formData.append(
            'file',
            uploadPayload,
            originalName
        );

        formData.append(
            'folder',
            normalizeFolder(options.folder)
        );

        const response = await fetch(
            `${R2_CONFIG.workerUrl}/upload`,
            {
                method: 'POST',
                headers: {
                    Authorization:
                        `Bearer ${token}`
                },
                body: formData
            }
        );

        const result = await response
            .json()
            .catch(() => null);

        if (
            !response.ok ||
            !result ||
            !result.url
        ) {
            throw new Error(
                getErrorMessage(result, response)
            );
        }

        return {
            provider:
                'cloudflare-r2',

            url:
                result.url,

            secureUrl:
                result.url,

            key:
                result.key || '',

            bucket:
                result.bucket || '',

            etag:
                result.etag || '',

            name:
                result.name ||
                originalName,

            type:
                result.type ||
                inferredContentType ||
                file.type ||
                'application/octet-stream',

            size:
                Number(result.size) ||
                Number(file.size) ||
                0,

            uploadedBy:
                result.uploadedBy || '',

            uploadedAt:
                Number(result.uploadedAt) ||
                Date.now(),

            schemaVersion: 1
        };
    }

    async function uploadFiles(
        fileList,
        options = {}
    ) {
        const files =
            Array.from(fileList || []);

        const results = [];

        for (const file of files) {
            try {
                results.push(
                    await uploadFile(
                        file,
                        options
                    )
                );
            } catch (error) {
                console.error(
                    'Cloudflare R2 upload error:',
                    file?.name,
                    error
                );

                alert(
                    `⚠️ Không tải được file ` +
                    `"${file?.name || 'không rõ'}": ` +
                    `${error.message}`
                );
            }
        }

        return results;
    }

    function isPlainObject(value) {
        return Boolean(
            value &&
            typeof value === 'object' &&
            !Array.isArray(value)
        );
    }

    function hasStorageField(value) {
        if (!isPlainObject(value)) {
            return false;
        }

        return Boolean(
            value.provider ||
            value.storageProvider ||
            value.key ||
            value.r2Key ||
            value.objectKey ||
            value.url ||
            value.secureUrl ||
            value.secure_url ||
            value.publicId ||
            value.public_id ||
            value.base64
        );
    }

    function flattenDeleteValues(
        value,
        output = []
    ) {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return output;
        }

        if (Array.isArray(value)) {
            value.forEach(item => {
                flattenDeleteValues(
                    item,
                    output
                );
            });

            return output;
        }

        /*
         * Firebase đôi khi biến mảng thành:
         * {
         *   "0": fileA,
         *   "1": fileB
         * }
         */
        if (
            isPlainObject(value) &&
            !hasStorageField(value)
        ) {
            const keys =
                Object.keys(value);

            const isNumericObject =
                keys.length > 0 &&
                keys.every(key =>
                    /^\d+$/.test(key)
                );

            if (isNumericObject) {
                keys
                    .sort(
                        (a, b) =>
                            Number(a) -
                            Number(b)
                    )
                    .forEach(key => {
                        flattenDeleteValues(
                            value[key],
                            output
                        );
                    });

                return output;
            }
        }

        output.push(value);

        return output;
    }

    function safeStorageText(value) {
        return String(
            value === null ||
                value === undefined
                ? ''
                : value
        ).trim();
    }

    function normalizeStorageProvider(value) {
        return safeStorageText(value)
            .toLowerCase()
            .replace(/[_\s]+/g, '-');
    }

    function isEmbeddedFile(value) {
        return /^(data:|blob:|file:)/i.test(
            safeStorageText(value)
        );
    }

    function isCloudinaryUrl(value) {
        return /^https?:\/\/res\.cloudinary\.com\//i
            .test(
                safeStorageText(value)
            );
    }

    function normalizeDeleteAsset(value) {
        if (
            value === null ||
            value === undefined ||
            value === ''
        ) {
            return null;
        }

        /*
         * Dữ liệu file chỉ là chuỗi.
         */
        if (typeof value === 'string') {
            const text =
                safeStorageText(value);

            if (
                !text ||
                isEmbeddedFile(text)
            ) {
                /*
                 * Base64/blob/file cũ nằm trong Firebase.
                 * Không được gửi lên Worker.
                 */
                return null;
            }

            if (isCloudinaryUrl(text)) {
                return {
                    provider:
                        'cloudinary',

                    url:
                        text
                };
            }

            if (/^https?:\/\//i.test(text)) {
                return {
                    provider:
                        'cloudflare-r2',

                    url:
                        text
                };
            }

            /*
             * Chuỗi không phải URL được xem là R2 key.
             */
            return {
                provider:
                    'cloudflare-r2',

                key:
                    text.replace(/^\/+/, '')
            };
        }

        /*
         * Bỏ qua File, Blob và kiểu dữ liệu lạ.
         */
        if (!isPlainObject(value)) {
            return null;
        }

        const provider =
            normalizeStorageProvider(
                value.provider ||
                value.storageProvider ||
                ''
            );

        const key =
            safeStorageText(
                value.key ||
                value.r2Key ||
                value.objectKey ||
                ''
            ).replace(/^\/+/, '');

        const url =
            safeStorageText(
                value.url ||
                value.secureUrl ||
                value.secure_url ||
                value.href ||
                ''
            );

        const publicId =
            safeStorageText(
                value.publicId ||
                value.public_id ||
                ''
            );

        const resourceType =
            safeStorageText(
                value.resourceType ||
                value.resource_type ||
                ''
            );

        /*
         * File Base64 cũ không nằm trên R2/Cloudinary.
         * Khi xóa Firebase thì Base64 cũng tự mất.
         */
        if (
            value.base64 &&
            !key &&
            !publicId &&
            !url
        ) {
            return null;
        }

        if (
            isEmbeddedFile(url) &&
            !key &&
            !publicId
        ) {
            return null;
        }

        /*
         * File Cloudinary.
         */
        if (
            provider === 'cloudinary' ||
            publicId ||
            isCloudinaryUrl(url)
        ) {
            return {
                provider:
                    'cloudinary',

                publicId:
                    publicId,

                resourceType:
                    resourceType ||
                    'image',

                url:
                    url
            };
        }

        /*
         * File Cloudflare R2.
         */
        if (
            provider === 'cloudflare-r2' ||
            provider === 'r2' ||
            key ||
            url
        ) {
            return {
                provider:
                    'cloudflare-r2',

                key:
                    key,

                bucket:
                    safeStorageText(
                        value.bucket
                    ),

                url:
                    url
            };
        }

        return null;
    }

    function normalizeDeleteAssets(values) {
        const rawAssets =
            flattenDeleteValues(values);

        const assets = [];
        const identities =
            new Set();

        let skippedCount = 0;

        rawAssets.forEach(value => {
            const asset =
                normalizeDeleteAsset(value);

            if (!asset) {
                skippedCount++;
                return;
            }

            const identity = [
                asset.provider || '',
                asset.key ||
                asset.publicId ||
                asset.url ||
                ''
            ].join('|');

            if (
                !identity ||
                identities.has(identity)
            ) {
                return;
            }

            identities.add(identity);
            assets.push(asset);
        });

        console.log(
            '[Storage delete]',
            {
                inputCount:
                    rawAssets.length,

                normalizedCount:
                    assets.length,

                skippedCount
            }
        );

        return assets;
    }

    function isFileAlreadyDeleted(failure) {
        const message =
            safeStorageText(
                failure?.error ||
                failure?.message ||
                failure
            ).toLowerCase();

        return (
            message.includes('not found') ||
            message.includes('no such key') ||
            message.includes('already deleted') ||
            message.includes('không tồn tại') ||
            message.includes('khong ton tai') ||
            /\b404\b/.test(message)
        );
    }

    async function sendDeleteBatch(
        assets,
        token
    ) {
        let response;

        try {
            response = await fetch(
                `${R2_CONFIG.workerUrl}/delete-assets`,
                {
                    method:
                        'POST',

                    headers: {
                        Authorization:
                            `Bearer ${token}`,

                        'Content-Type':
                            'application/json'
                    },

                    body:
                        JSON.stringify({
                            assets
                        })
                }
            );
        } catch (originalError) {
            const error =
                new Error(
                    'Không kết nối được Worker khi xóa file. ' +
                    'Hãy kiểm tra Worker Logs hoặc dữ liệu file cũ.'
                );

            error.cause =
                originalError;

            throw error;
        }

        const responseText =
            await response.text();

        let result = null;

        if (responseText) {
            try {
                result =
                    JSON.parse(
                        responseText
                    );
            } catch (error) {
                result = null;
            }
        }

        if (!response.ok) {
            throw new Error(
                result?.error ||
                result?.message ||
                (
                    `Cloudflare R2 trả về lỗi HTTP ` +
                    `${response.status}. ` +
                    responseText.slice(0, 200)
                )
            );
        }

        return result || {
            ok: true,
            deleted: [],
            failures: []
        };
    }

    async function deleteAssets(
        values
    ) {
        if (!isConfigured()) {
            throw new Error(
                'Chưa cấu hình R2_WORKER_URL.'
            );
        }

        /*
         * Chỉ lấy metadata cần thiết.
         * Không gửi Base64 hoặc nguyên object lớn.
         */
        const assets =
            normalizeDeleteAssets(values);

        if (assets.length === 0) {
            return {
                ok: true,
                deleted: [],
                failures: []
            };
        }

        const token =
            await getIdToken();

        const deleted = [];
        const failures = [];

        /*
         * Chia nhỏ, tối đa 20 file/request.
         */
        const BATCH_SIZE = 20;

        for (
            let index = 0;
            index < assets.length;
            index += BATCH_SIZE
        ) {
            const batch =
                assets.slice(
                    index,
                    index + BATCH_SIZE
                );

            const result =
                await sendDeleteBatch(
                    batch,
                    token
                );

            if (
                Array.isArray(
                    result?.deleted
                )
            ) {
                deleted.push(
                    ...result.deleted
                );
            }

            const batchFailures =
                Array.isArray(
                    result?.failures
                )
                    ? result.failures
                    : [];

            batchFailures.forEach(
                failure => {
                    /*
                     * File đã bị xóa trước đó thì
                     * không chặn xóa bài tập.
                     */
                    if (
                        isFileAlreadyDeleted(
                            failure
                        )
                    ) {
                        console.warn(
                            'File đã mất hoặc đã xóa:',
                            failure
                        );

                        return;
                    }

                    failures.push(
                        failure
                    );
                }
            );
        }

        if (failures.length > 0) {
            const error =
                new Error(
                    failures[0]?.error ||
                    failures[0]?.message ||
                    'Có file không xóa được.'
                );

            error.failures =
                failures;

            throw error;
        }

        return {
            ok: true,
            deleted,
            failures: []
        };
    }

    async function deleteFile(
        value
    ) {
        return deleteAssets(
            [value]
        );
    }

    async function deleteFiles(
        values
    ) {
        return deleteAssets(
            values
        );
    }

    window.CloudflareR2Storage =
        Object.freeze({
            config:
                R2_CONFIG,

            isConfigured,

            uploadFile,
            uploadFiles,

            deleteFile,
            deleteFiles,
            deleteAssets
        });
})();