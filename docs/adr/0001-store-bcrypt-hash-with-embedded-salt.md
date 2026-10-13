# Store bcrypt hashes with their embedded salt

**Status: accepted**

The current user model stores a bcrypt hash and its salt in separate fields, although the bcrypt encoded hash already contains the algorithm version, cost, salt, and derived hash. The owner prefers a one-time migration for this personal project with few users: rename the existing `password` column to `password_hash`, preserving its bcrypt hash values without re-hashing, and drop the redundant `salt` column in the same change. Update the application and seed code together without a dual-read compatibility layer; password verification should use `bcrypt.compare` against the encoded hash.
