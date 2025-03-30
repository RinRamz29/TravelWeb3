import { AuthClient } from "@dfinity/auth-client";

const authClient = await AuthClient.create({
  idleOptions: { idleTimeout: 1000 * 60 * 30 }, // 30 minutes
  host: "http://localhost:8000"
});

// ... rest of the code ...
