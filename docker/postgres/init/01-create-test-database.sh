#!/bin/sh
# Runs once, when the data volume is first initialised.
# Creates a separate database for integration tests so they never touch development data.
set -eu

psql --variable=ON_ERROR_STOP=1 --username "$POSTGRES_USER" --dbname "$POSTGRES_DB" <<-SQL
  CREATE DATABASE "${POSTGRES_DB}_test";
SQL
