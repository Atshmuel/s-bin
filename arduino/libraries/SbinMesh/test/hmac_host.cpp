#include "SbinMeshAuth.h"

#ifdef __APPLE__
#include <CommonCrypto/CommonHMAC.h>
#else
#include <openssl/evp.h>
#include <openssl/hmac.h>
#endif

// HMAC-SHA256 for the tests, which run on a computer.
namespace sbinmesh {

void hmacSha256(const uint8_t* key, size_t keyLength, const uint8_t* data, size_t dataLength,
                uint8_t out[32]) {
#ifdef __APPLE__
    CCHmac(kCCHmacAlgSHA256, key, keyLength, data, dataLength, out);
#else
    unsigned int length = 32;
    HMAC(EVP_sha256(), key, static_cast<int>(keyLength), data, dataLength, out, &length);
#endif
}

}  // namespace sbinmesh
