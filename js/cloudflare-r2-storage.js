(function () {
    'use strict';

    const DEFAULT_WORKER_URL =
        'https://YOUR-R2-WORKER.YOUR-SUBDOMAIN.workers.dev';

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

        const maxSizeBytes =
            Number(options.maxSizeBytes) ||
            R2_CONFIG.defaultMaxFileSize;

        if (file.size > maxSizeBytes) {
            const maxMB =
                maxSizeBytes / (1024 * 1024);

            throw new Error(
                `File vượt giới hạn ` +
                `${maxMB.toFixed(0)} MB.`
            );
        }

        const originalName =
            options.fileName ||
            file.name ||
            `file-${Date.now()}`;

        const token = await getIdToken();
        const formData = new FormData();

        formData.append(
            'file',
            file,
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
            value.forEach(item =>
                flattenDeleteValues(
                    item,
                    output
                )
            );

            return output;
        }

        output.push(value);

        return output;
    }

    async function deleteAssets(
        values
    ) {
        if (!isConfigured()) {
            throw new Error(
                'Chưa cấu hình R2_WORKER_URL.'
            );
        }

        const assets =
            flattenDeleteValues(values);

        if (assets.length === 0) {
            return {
                ok:
                    true,
                deleted:
                    [],
                failures:
                    []
            };
        }

        const token =
            await getIdToken();

        const response =
            await fetch(
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

        const result =
            await response
                .json()
                .catch(() => null);

        if (!response.ok) {
            throw new Error(
                getErrorMessage(
                    result,
                    response
                )
            );
        }

        const failures =
            Array.isArray(
                result?.failures
            )
                ? result.failures
                : [];

        if (failures.length > 0) {
            const error =
                new Error(
                    failures[0]?.error ||
                    'Có file không xóa được.'
                );

            error.failures =
                failures;

            throw error;
        }

        return result;
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