import typescript from "rollup-plugin-typescript2";

export default {
  input: "src/index.ts",
  output: [
    {
      file: "dist/abstracted-client.es.js",
      format: "es",
      sourcemap: true
    },
    {
      file: "dist/abstracted-client.cjs.js",
      format: "cjs",
      sourcemap: true
    },
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
  // external: [
  //   "firebase-api-surface",
  //   "typed-conversions",
  //   "serialized-query",
  //   "@firebase/app-types"
  // ],
  plugins: [
    typescript({
      tsconfig: "tsconfig.esnext.json"
    })
  ]
};
