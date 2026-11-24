// Vite `?raw` imports (used to load index.html into jsdom in UI tests).
declare module '*?raw' {
  const content: string
  export default content
}
