/** App version string in "v X.Y.Z" format — sourced from package.json at build time. */
export const APP_VERSION = `v ${process.env.NEXT_PUBLIC_APP_VERSION ?? '0.0.0'}`
