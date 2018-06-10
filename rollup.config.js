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
      sourcemap: true
    }
  ],
  external: [
    "firebase-api-surface",
    "typed-conversions",
    "serialized-query",
    "@firebase/app-types"
  ]
};
