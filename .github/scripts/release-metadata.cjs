// Validate release metadata before installing dependencies or publishing.
const { readFileSync, appendFileSync } = require('node:fs');

function classify(version) {
  if (/^\d+\.\d+\.\d+$/.test(version)) return 'latest';
  const match = /^\d+\.\d+\.\d+-(beta|dev)(?:\.[0-9A-Za-z-]+)*$/.exec(version);
  if (match) return match[1];
  throw new Error(`Unsupported release version ${version}; expected stable, beta or dev. Refusing to publish as latest.`);
}

try {
  const [command, value, ...files] = process.argv.slice(2);
  if (command === 'classify') {
    console.log(classify(value));
  } else if (command === 'validate') {
    const tag = value;
    if (!tag || !/^v\d+\.\d+\.\d+(?:-[0-9A-Za-z.-]+)?$/.test(tag)) {
      throw new Error(`Expected a v-prefixed release tag, got ${tag}`);
    }
    if (!files.length) throw new Error('At least one package.json path is required.');
    const version = tag.slice(1);
    const packages = files.map((file) => ({
      file,
      ...JSON.parse(readFileSync(file, 'utf8')),
    }));
    console.log(`Detected tag: ${tag}`);
    for (const pkg of packages) {
      console.log(`${pkg.file}: ${pkg.name}@${pkg.version}`);
    }
    for (const pkg of packages) {
      if (pkg.version !== version) {
        throw new Error(`Tag ${tag} (version ${version}) does not match ${pkg.file} version ${pkg.version}`);
      }
    }
    const publishTag = classify(version);
    console.log(`Version check: OK (${tag})`);
    console.log(`Publish tag: ${publishTag}`);
    if (process.env.GITHUB_ENV) {
      appendFileSync(process.env.GITHUB_ENV, `VERSION=${version}\nPUBLISH_TAG=${publishTag}\n`);
    }
  } else {
    throw new Error('Usage: release-metadata.cjs validate TAG PACKAGE_JSON... | classify VERSION');
  }
} catch (error) {
  console.error(`::error::${error.message}`);
  process.exitCode = 1;
}
