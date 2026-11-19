import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentFile = fileURLToPath(import.meta.url);
const currentDirectory = path.dirname(currentFile);

const sourceDirectory = path.resolve(
  currentDirectory,
  '../../backend/public/uploads'
);

const destinationDirectory = path.resolve(
  currentDirectory,
  '../public/uploads'
);

await rm(destinationDirectory, {
  recursive: true,
  force: true,
});

await mkdir(destinationDirectory, {
  recursive: true,
});

await cp(sourceDirectory, destinationDirectory, {
  recursive: true,
});

console.log('Strapi media synchronized successfully.');