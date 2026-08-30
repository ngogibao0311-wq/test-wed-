(function () {
    'use strict';

    const CLOUDINARY_CONFIG = Object.freeze({
        cloudName: 'kexe2zqv',
        uploadPreset: 'quan_ly_bai_tap',

        // Mặc định cho file bài tập, tài liệu và bài nộp.
        defaultMaxFileSize: 5 * 1024 * 1024
    });

    /**
     * Upload một File hoặc Blob lên Cloudinary.
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

        const formData = new FormData();

        formData.append(
            'file',
            file,
            originalName
        );

        formData.append(
            'upload_preset',
            CLOUDINARY_CONFIG.uploadPreset
        );

        const endpoint =
            `https://api.cloudinary.com/v1_1/` +
            `${encodeURIComponent(
                CLOUDINARY_CONFIG.cloudName
            )}/auto/upload`;

        const response = await fetch(
            endpoint,
            {
                method: 'POST',
                body: formData
            }
        );

        const result =
            await response
                .json()
                .catch(() => null);

        if (
            !response.ok ||
            !result ||
            !result.secure_url
        ) {
            throw new Error(
                result?.error?.message ||
                `Cloudinary trả về lỗi HTTP ${response.status}.`
            );
        }

        /*
         * Chỉ trả về metadata ngắn.
         * Không trả Base64 về Firebase.
         */
        return {
            provider: 'cloudinary',

            url:
                result.secure_url,

            secureUrl:
                result.secure_url,

            publicId:
                result.public_id || '',

            assetId:
                result.asset_id || '',

            resourceType:
                result.resource_type || '',

            format:
                result.format || '',

            name:
                originalName,

            type:
                file.type ||
                'application/octet-stream',

            size:
                Number(result.bytes) ||
                Number(file.size) ||
                0,

            width:
                Number(result.width) ||
                null,

            height:
                Number(result.height) ||
                null,

            uploadedAt:
                Date.now()
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
                    'Cloudinary upload error:',
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