# `v0` > `v1`

- Database and Collection naming:
  - _Database official named "yargspy"._
  - _Collections official named "admin\_logs", "email\_tokens", "scores", "songs", and "users"._

- Migration
  - `UserModel`
    - Force `email` field to lowercase.
    - Add field `usernameSearch`, `usernameSort`.
