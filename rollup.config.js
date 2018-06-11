export default {
  input: "dist/esnext/index.js",
  output: [
    // {
    //   file: "dist/abstracted-client.cjs.js",
    //   format: "cjs",
    //   name: "AbstractedClient",
    //   sourcemap: true
    // },
    {
      file: "dist/abstracted-client.umd.js",
      format: "umd",
      name: "AbstractedClient",
      sourcemap: true,
      globals: {
        events: "EventEmitter",
        "abstracted-firebase": "abstracted-firebase",
        "@firebase/database": "database"
      }
    }
  ],
  external: [
    "firebase-api-surface",
    "typed-conversions",
    "serialized-query",
    "@firebase/app-types"
  ]
};
