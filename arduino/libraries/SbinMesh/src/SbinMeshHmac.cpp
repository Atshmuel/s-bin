#include "SbinMeshAuth.h"

#include <mbedtls/md.h>

// The ESP32's HMAC-SHA256 (mbedTLS, hardware accelerated).
namespace sbinmesh {

void hmacSha256(const uint8_t* key, size_t keyLength, const uint8_t* data, size_t dataLength,
                uint8_t out[32]) {
    mbedtls_md_hmac(mbedtls_md_info_from_type(MBEDTLS_MD_SHA256), key, keyLength, data, dataLength, out);
}

}  // namespace sbinmesh
