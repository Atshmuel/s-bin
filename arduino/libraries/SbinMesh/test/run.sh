#!/bin/sh
# Builds and runs the mesh authentication tests on this computer.
set -e
cd "$(dirname "$0")"
LIBS=""
[ "$(uname)" = "Darwin" ] || LIBS="-lcrypto"
c++ -std=c++17 -Wall -Wextra -I ../src auth_test.cpp hmac_host.cpp ../src/SbinMeshAuth.cpp $LIBS -o /tmp/sbinmesh_auth_test
/tmp/sbinmesh_auth_test
