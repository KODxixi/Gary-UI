# Third-party license texts

These files preserve upstream license and copyright notices for Gary-UI's
installed visual and React adapter dependencies. They are not relicensed by the
Gary-UI project. Original authors, source locations, versions and SHA-256 hashes
are recorded in [manifest.json](manifest.json).

Most files are byte-for-byte copies of installed package notices. A complete
License section in an upstream README may be extracted verbatim; this is marked
in its manifest record. Pinned supplemental repository notices are recorded in
[supplemental-sources.json](supplemental-sources.json).

Packages that ship no license text at all are recorded with
`licenseTextStatus: declared-only`; their package metadata is kept as evidence of
the upstream declaration, not as a fabricated license or copyright notice. The
manifest keeps `licenseTextComplete: false` while any remain, and
`missingLicenseText` lists exactly which (currently seven, including
`reicon@1.2.5` and `reicon-react@1.2.6`). Reicon declares MIT for its own work
but is built on Solar Icons (CC BY 4.0, attribution required) and Zappicon; see
[the toolchain record](../../adapters/visual/LICENSES.md) and
[THIRD_PARTY_NOTICES.md](../../THIRD_PARTY_NOTICES.md) for the attribution that
applies to it.

Run `python scripts/collect_third_party_licenses.py` from the repository root
after installing both adapters to reproduce the collection without downloading
anything, then `python scripts/build_license_bundle.py` to refresh
[THIRD_PARTY_LICENSES.txt](THIRD_PARTY_LICENSES.txt) from the collected copies
(`--check` fails if the bundle has gone stale). See
[the toolchain record](../../adapters/visual/LICENSES.md) for scope
and redistribution notes. React Bits components are excluded from this collection.
