module.exports = {
  hooks: {
    readPackage(pkg) {
      if (pkg.dependencies && pkg.dependencies['@clerk/shared']) {
        pkg.dependencies['@clerk/shared'] = '4.14.0';
      }
      if (pkg.peerDependencies && pkg.peerDependencies['@clerk/shared']) {
        pkg.peerDependencies['@clerk/shared'] = '4.14.0';
      }
      return pkg;
    }
  }
};
