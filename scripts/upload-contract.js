#!/usr/bin/env node
const fs = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '..');
const contractsDir = path.join(rootDir, 'contracts', 'account');

const apiConfig = {
  url: 'https://k59q9.wiremockapi.cloud/__admin/mocklab/imports',
  method: 'POST',
  authorization: 'Token wmcp_lw7ee_8bdf739875ac2e93bc368b3d0bdaff47_c1c6c4da',
  bodyField: 'file',
};

function findYamlFiles(directory) {
  if (!fs.existsSync(directory)) {
    throw new Error(`Contracts directory not found: ${directory}`);
  }

  const files = fs
    .readdirSync(directory)
    .filter((name) => /\.(ya?ml)$/i.test(name))
    .map((name) => path.join(directory, name));

  if (files.length === 0) {
    throw new Error(`No YAML file found in contracts folder: ${directory}`);
  }

  return files;
}

async function uploadYamlFile(filePath) {
  const fileBuffer = fs.readFileSync(filePath);
  const fileName = path.basename(filePath);
  const FormDataClass = globalThis.FormData || require('node:formdata').FormData;
  const BlobClass = globalThis.Blob || require('node:buffer').Blob;

  if (!FormDataClass || !BlobClass) {
    throw new Error('Node 18+ is required for native FormData support.');
  }

  const form = new FormDataClass();
  const blob = new BlobClass([fileBuffer], { type: 'application/x-yaml' });
  form.set(apiConfig.bodyField, blob, fileName);

  const headers = {};
  if (apiConfig.authorization) {
    headers.Authorization = apiConfig.authorization;
  }

  const response = await fetch(apiConfig.url, {
    method: apiConfig.method,
    headers,
    body: form,
  });

  const responseText = await response.text();
  return { response, responseText, fileName };
}

async function main() {
  const yamlFiles = findYamlFiles(contractsDir);
  console.log(`Found ${yamlFiles.length} YAML file(s) to upload.`);

  for (const filePath of yamlFiles) {
    console.log(`Uploading ${path.basename(filePath)}...`);
    const { response, responseText, fileName } = await uploadYamlFile(filePath);

    if (!response.ok) {
      console.error(`Upload failed for ${fileName}.`);
      console.error('Response status:', response.status);
      console.error(responseText);
      process.exit(1);
    }

    console.log(`Upload successful for ${fileName}.`);
    console.log('Response status:', response.status);
    console.log(responseText);
  }

  console.log('All YAML files uploaded successfully.');
  process.exit(0);
}

main().catch((error) => {
  console.error('Error:', error.message || error);
  process.exit(1);
});
