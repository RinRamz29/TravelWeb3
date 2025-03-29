// This file serves as a centralized import point for dfinity packages
// to help resolve any import issues
import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
// Import the entire module and then extract Identity
import * as identity from "@dfinity/identity";

export {
  AuthClient,
  HttpAgent,
  Principal,
  identity
};
