import typescript from '@rollup/plugin-typescript';
import  resolve from '@rollup/plugin-node-resolve';
import commonjs from '@rollup/plugin-commonjs';

export default {
  input: 'src/index.ts',
  output: [
    {
      file: 'dist/concurrencyQueue.esm.js',
      format: 'esm',
      sourcemap: true
    },
    {
      file: 'dist/concurrencyQueue.amd.js',
      format: 'amd',
      sourcemap: true
    }
  ],
  plugins: [
    resolve(),
    commonjs(),
    typescript({ tsconfig: './tsconfig.json' })
  ]
};