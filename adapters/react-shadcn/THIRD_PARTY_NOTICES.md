# Third-party notices

This adapter references React, Tailwind CSS, shadcn, Radix UI,
class-variance-authority, clsx and tailwind-merge through pinned package dependencies.
Review their licenses in the consuming project before distribution. Collected
license texts, versions and SHA-256 hashes live in
[`licenses/third-party/manifest.json`](../../licenses/third-party/manifest.json),
with the consolidated text in
[`THIRD_PARTY_LICENSES.txt`](../../licenses/third-party/THIRD_PARTY_LICENSES.txt);
both are reproduced by
[`scripts/collect_third_party_licenses.py`](../../scripts/collect_third_party_licenses.py)
and [`scripts/build_license_bundle.py`](../../scripts/build_license_bundle.py).

## Icons

Component icons come from **reicon-react** (pinned to `1.2.6`), MIT licensed,
Copyright (c) 2025 REICON — <https://github.com/dqev/reicon>.

Reicon is built on the base elements listed below. Their attribution is reproduced
here because redistributed icon geometry carries it forward. Reicon's own
documentation describes its license as "MIT ... no attribution required"; that
statement covers Reicon's own work only and does not remove the upstream
obligations below.

Neither `reicon-react` nor `reicon` ships a license file inside the npm package:
both only declare `"license": "MIT"` in their metadata. The collected manifest
therefore records them as `declared-only` with `licenseTextComplete: false`
instead of fabricating a license text.

- **Solar Icons** — base elements by 480 Design, package maintained by Saoudi H.
  (<https://solar-icons.vercel.app/>, <https://github.com/saoudi-h/solar-icons>),
  released under **CC BY 4.0** — attribution is required.
- **Zappicon** (<https://zappicon.com>) — subject to the Zappicon License
  (<https://zappicon.com/license>), which prohibits redistributing its icons in
  original or modified form, using them to create new icon packs or to add to
  other icon libraries, and including them in products sold to third parties
  without an extended license. The Zappicon brand identity must remain; it is
  not transferred by Reicon's MIT grant.

Attribution as stated by Reicon (<https://reicon.dev/llms-full.txt>): "Base
elements from Solar Icons (CC BY 4.0) by 480 Design and Zappicon."

`lucide-react` is no longer used by this adapter. The vanilla static icon layer
and the morph-icons mechanism elsewhere in the repository still use Lucide
geometry, as described in the repository root
[`THIRD_PARTY_NOTICES.md`](../../THIRD_PARTY_NOTICES.md).

