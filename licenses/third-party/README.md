# Third-party license texts

These files preserve upstream license and copyright notices for Gary-UI's
installed visual and React adapter dependencies. They are not relicensed by the
Gary-UI project. Original authors, source locations, versions and SHA-256 hashes
are recorded in [manifest.json](manifest.json).

Most files are byte-for-byte copies of installed package notices. A complete
License section in an upstream README may be extracted verbatim; this is marked
in its manifest record. Pinned supplemental repository notices are recorded in
[supplemental-sources.json](supplemental-sources.json).

Two packages currently provide an MIT declaration without full license text:
`@antv/event-emitter@0.1.3` and `measury@0.1.5`. Their original package metadata is
included with `licenseTextStatus: declared-only`. It is evidence of the upstream
declaration, not a fabricated license or copyright notice. The manifest keeps
`licenseTextComplete: false` until these upstream text gaps are resolved.

Run `python scripts/collect_third_party_licenses.py` from the repository root
after installing both adapters to reproduce the collection without downloading
anything. See [the toolchain record](../../adapters/visual/LICENSES.md) for scope
and redistribution notes. React Bits components are excluded from this collection.
