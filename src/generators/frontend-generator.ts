import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import type { EconomyParams } from "./config-generator";

export function generateFrontendPackageJson(params: EconomyParams, frontendDir: string): void {
  const pkg = {
    name: params.projectName.toLowerCase().replace(/\s+/g, "-") + "-dashboard",
    version: "1.0.0",
    private: true,
    type: "module",
    scripts: {
      dev: "vite",
      build: "tsc && vite build",
      preview: "vite preview",
      lint: "eslint src --ext .ts,.tsx",
    },
    dependencies: {
      "@rainbow-me/rainbowkit": "^2.1.7",
      "@tanstack/react-query": "^5.51.21",
      react: "^18.3.1",
      "react-dom": "^18.3.1",
      "react-router-dom": "^6.25.1",
      viem: "^2.18.1",
      wagmi: "^2.12.3",
    },
    devDependencies: {
      "@types/react": "^18.3.3",
      "@types/react-dom": "^18.3.0",
      "@vitejs/plugin-react": "^4.3.1",
      autoprefixer: "^10.4.19",
      postcss: "^8.4.40",
      tailwindcss: "^3.4.7",
      typescript: "^5.5.3",
      vite: "^5.3.4",
    },
  };

  writeFileSync(join(frontendDir, "package.json"), JSON.stringify(pkg, null, 2));
}

export function generateViteConfig(frontendDir: string): void {
  const content = `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: { "@": "/src" },
  },
  build: {
    target: "es2022",
    sourcemap: true,
  },
});
`;
  writeFileSync(join(frontendDir, "vite.config.ts"), content);
}

export function generateTailwindConfig(frontendDir: string): void {
  const content = `import type { Config } from "tailwindcss";

export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        pharos: {
          50:  "#f0f4ff",
          100: "#dce7ff",
          200: "#b9ceff",
          300: "#85a8ff",
          400: "#4d7aff",
          500: "#1a4dff",
          600: "#0033e6",
          700: "#0028b8",
          800: "#001f8a",
          900: "#001566",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
`;
  writeFileSync(join(frontendDir, "tailwind.config.ts"), content);
}

export function generateFrontendIndexHtml(params: EconomyParams, frontendDir: string): void {
  const content = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/pharos.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${params.projectName} — Economy Dashboard</title>
    <meta name="description" content="${params.tokenName} (${params.symbol}) reward economy dashboard powered by Pharos Network" />
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>
`;
  writeFileSync(join(frontendDir, "index.html"), content);
}

export function generateFrontendTsConfig(frontendDir: string): void {
  const content = JSON.stringify(
    {
      compilerOptions: {
        target: "ES2022",
        useDefineForClassFields: true,
        lib: ["ES2022", "DOM", "DOM.Iterable"],
        module: "ESNext",
        skipLibCheck: true,
        moduleResolution: "bundler",
        allowImportingTsExtensions: true,
        resolveJsonModule: true,
        isolatedModules: true,
        noEmit: true,
        jsx: "react-jsx",
        strict: true,
        noUnusedLocals: true,
        noUnusedParameters: true,
        noFallthroughCasesInSwitch: true,
        baseUrl: ".",
        paths: { "@/*": ["src/*"] },
      },
      include: ["src"],
      references: [{ path: "./tsconfig.node.json" }],
    },
    null,
    2
  );
  writeFileSync(join(frontendDir, "tsconfig.json"), content);

  const nodeConfig = JSON.stringify(
    {
      compilerOptions: {
        composite: true,
        skipLibCheck: true,
        module: "ESNext",
        moduleResolution: "bundler",
        allowSyntheticDefaultImports: true,
        strict: true,
      },
      include: ["vite.config.ts", "tailwind.config.ts"],
    },
    null,
    2
  );
  writeFileSync(join(frontendDir, "tsconfig.node.json"), nodeConfig);
}

export function generatePostcssConfig(frontendDir: string): void {
  const content = `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
`;
  writeFileSync(join(frontendDir, "postcss.config.js"), content);
}

export function scaffoldFrontendDirs(frontendDir: string): void {
  const dirs = [
    "src/pages",
    "src/components",
    "src/hooks",
    "src/lib",
    "src/types",
    "public",
  ];
  for (const d of dirs) {
    mkdirSync(join(frontendDir, d), { recursive: true });
  }
}
