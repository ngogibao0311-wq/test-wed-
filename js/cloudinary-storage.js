(function () {
    'use strict';

    /*
     * SECURITY PATCH:
     * CloudinaryStorage được giữ lại như API tương thích cho code cũ,
     * nhưng KHÔNG còn upload trực tiếp tới Cloudinary bằng unsigned preset.
     *
     * Mọi upload mới được chuyển qua CloudflareR2Storage, nơi Worker
     * yêu cầu Firebase ID token trong Authorization: Bearer.
     */
    const CLOUDINARY_CONFIG = Object.freeze({
        provider: 'cloudflare-r2',
        compatibilityMode: true,

        // Giữ giới hạn cũ để không đổi hành vi các màn hình đang dùng.
        defaultMaxFileSize: 5 * 1024 * 1024
    });

    function getSecureStorage() {
        const storage =
            window.CloudflareR2Storage;

        if (
            !storage ||
            typeof storage.uploadFile !==
                'function'
        ) {
            throw new Error(
                'Kho lưu trữ bảo mật R2 chưa sẵn sàng. ' +
                'Vui lòng tải lại trang rồi thử lại.'
            );
        }

        if (
            typeof storage.isConfigured ===
                'function' &&
            !storage.isConfigured()
        ) {
            throw new Error(
                'Cloudflare R2 chưa được cấu hình.'
            );
        }

        return storage;
    }

    /**
     * API tương thích với CloudinaryStorage.uploadFile cũ.
     * Upload thật được thực hiện qua Cloudflare R2 + Firebase ID token.
     *
     * @param {File|Blob} file
     * @param {Object} options
     * @returns {Promise<Object>}
     */
    async function uploadFile(
        file,
        options = {}
    ) {
        if (!(file instanceof Blob)) {
            throw new Error(
                'Dữ liệu tải lên không phải File hoặc Blob.'
            );
        }

        const maxSizeBytes =
            Number(options.maxSizeBytes) ||
            CLOUDINARY_CONFIG.defaultMaxFileSize;

        if (file.size > maxSizeBytes) {
            const maxMB =
                maxSizeBytes / (1024 * 1024);

            throw new Error(
                `File vượt giới hạn ${maxMB.toFixed(0)} MB.`
            );
        }

        const originalName =
            options.fileName ||
            file.name ||
            `file-${Date.now()}`;

        const storage =
            getSecureStorage();

        const uploaded =
            await storage.uploadFile(
                file,
                {
                    ...options,
                    fileName:
                        originalName,

                    maxSizeBytes,

                    /*
                     * Một thư mục chung cho các caller cũ của
                     * CloudinaryStorage. Caller có thể truyền folder
                     * riêng và giá trị đó vẫn được ưu tiên.
                     */
                    folder:
                        options.folder ||
                        'legacy-cloudinary-migrated'
                }
            );

        /*
         * Trả về metadata tương thích:
         * - url/secureUrl vẫn giữ nguyên contract cũ
         * - provider phản ánh storage thật để xóa file đúng backend
         */
        return {
            ...uploaded,

            provider:
                uploaded.provider ||
                'cloudflare-r2',

            url:
                uploaded.url ||
                uploaded.secureUrl,

            secureUrl:
                uploaded.secureUrl ||
                uploaded.url,

            name:
                uploaded.name ||
                originalName,

            type:
                uploaded.type ||
                file.type ||
                'application/octet-stream',

            size:
                Number(uploaded.size) ||
                Number(file.size) ||
                0,

            uploadedAt:
                Number(uploaded.uploadedAt) ||
                Date.now(),

            migratedFrom:
                'cloudinary-unsigned-client'
        };
    }

    /**
     * Upload nhiều file lần lượt.
     *
     * File lỗi được bỏ qua nhưng các file còn lại
     * vẫn tiếp tục tải.
     */
    async function uploadFiles(
        fileList,
        options = {}
    ) {
        const files =
            Array.from(fileList || []);

        const results = [];

        for (const file of files) {
            try {
                const uploaded =
                    await uploadFile(
                        file,
                        options
                    );

                results.push(uploaded);
            } catch (error) {
                console.error(
                    'Secure storage upload error:',
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

    /**
     * Chuyển Canvas thành File mà không tạo Base64.
     */
    function canvasToFile(
        canvas,
        fileName,
        mimeType = 'image/png',
        quality = 0.92
    ) {
        return new Promise(
            (resolve, reject) => {
                if (!canvas) {
                    reject(
                        new Error(
                            'Không tìm thấy canvas.'
                        )
                    );

                    return;
                }

                canvas.toBlob(
                    blob => {
                        if (!blob) {
                            reject(
                                new Error(
                                    'Không thể tạo file ảnh từ canvas.'
                                )
                            );

                            return;
                        }

                        resolve(
                            new File(
                                [blob],
                                fileName ||
                                `image-${Date.now()}.png`,
                                {
                                    type:
                                        blob.type ||
                                        mimeType,

                                    lastModified:
                                        Date.now()
                                }
                            )
                        );
                    },
                    mimeType,
                    quality
                );
            }
        );
    }

    /**
     * Dùng sau này để chuyển dữ liệu Base64 cũ.
     */
    function dataUrlToFile(
        dataUrl,
        fileName
    ) {
        const parts =
            String(dataUrl || '')
                .split(',');

        if (parts.length < 2) {
            throw new Error(
                'Dữ liệu Base64 không hợp lệ.'
            );
        }

        const mimeMatch =
            parts[0].match(
                /data:([^;]+);base64/i
            );

        const mimeType =
            mimeMatch?.[1] ||
            'application/octet-stream';

        const binary =
            atob(parts[1]);

        const bytes =
            new Uint8Array(
                binary.length
            );

        for (
            let index = 0;
            index < binary.length;
            index++
        ) {
            bytes[index] =
                binary.charCodeAt(index);
        }

        return new File(
            [bytes],
            fileName ||
            `file-${Date.now()}`,
            {
                type: mimeType,
                lastModified: Date.now()
            }
        );
    }

    window.CloudinaryStorage = Object.freeze({
        config:
            CLOUDINARY_CONFIG,

        uploadFile,
        uploadFiles,
        canvasToFile,
        dataUrlToFile
    });
})();