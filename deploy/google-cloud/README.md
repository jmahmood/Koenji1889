# Google Cloud private-club deployment plan

Prepared October 21, 2026. Planning only: no cloud resources or DNS records have
been created. The game hostname is kbg.gaijinsize.com. Public DNS checks confirm
gaijinsize.com uses Cloudflare nameservers (jerry and evangeline); no A, AAAA or
CNAME answer was returned for the game hostname. The selected Google Cloud
project is project-b449cae6-1d45-4d2f-94e. Project access, billing, available
Free Tier allowances and IPv6 networking support have not yet been verified:
the available in-app browser requires Google sign-in. Follow ../../DEPLOYMENT.md
for application installation and backups.

## Proposed configuration

- One non-Spot e2-micro in Oregon (us-west1).
- Ubuntu 24.04 LTS, with at most 30 GB total standard persistent disk (pd-standard).
- External IPv6, with no external IPv4 address.
- Cloudflare Free proxy on kbg.gaijinsize.com, using a proxied AAAA record pointing
  to the VM. This lets friends use IPv4 or IPv6 to reach Cloudflare.
- HTTPS from players to Cloudflare and from Cloudflare to Nginx, with Full
  (strict) TLS. Restrict public web ingress to Cloudflare's published IPv6 ranges.
- One Python bridge process behind Nginx. Keep the bridge on localhost and games
  on persistent disk outside application releases. Do not add multiple workers.
- Daily SQLite backups with bounded retention; keep a private off-server copy.

## Cost conditions to verify before provisioning

Compute and disk should fit Google's Free Tier if this billing account has its
allowance available. IPv6 addresses have no address charge. This is a target of
$0 monthly hosting usage, not a spending cap or guarantee.

Standard Tier currently includes 200 GiB/month of outbound data per account.
Standard Tier external IPv6 is currently Preview and must be selected using the
CLI or API, rather than the console. Verify eligibility and support for the
chosen VM/subnet before creating it. Do not silently fall back to Premium:
the Compute Engine Free Tier documents only 1 GB/month of qualifying outbound
traffic, which is a materially smaller allowance.

Avoid adding Cloud NAT, a load balancer, paid OS images, or extra storage without
revising the estimate. Additional snapshots, backups and logging can incur costs.

The built site is approximately 159 MB on disk, including images and music;
this is not a measurement of bytes loaded on each visit. Each player polls for
state approximately every 1.4 seconds. Measure actual transfer during a full
game, with compression and caching configured, before estimating monthly use.
Cloudflare's CDN terms restrict disproportionate audio/image/large-file delivery;
review the actual asset traffic and hosting arrangement before publishing the
music-heavy experience through its free proxy.

## Deployment verification

Build the inner koenji-1889 application, run its existing checks, and install it
using the main deployment guide. Verify HTTPS and invites through the final
hostname, including a player using an IPv4-only connection. Start a two-player
game, restart the backend, and confirm both seats resume. Confirm development
routes are blocked, backups restore successfully in isolation, and traffic is
charged to the intended networking tier. Measure memory and route-computation
latency during a real game before expanding beyond a small group.

The local deployment launcher currently targets the Raspberry Pi frontend only;
it does not provision Google Cloud or deploy this backend. The Google Cloud CLI
was not found on this Mac during preparation. Cloud Shell is another option for
provisioning after selecting a project and signing in.

## Sources

- Free Tier: https://docs.cloud.google.com/free/docs/free-cloud-features
- Network and address pricing: https://cloud.google.com/vpc/network-pricing
- IPv6 setup and Standard Tier preview: https://docs.cloud.google.com/compute/docs/instances/create-ipv6-instance
- Cloudflare proxy records: https://developers.cloudflare.com/dns/proxy-status/
- Cloudflare IPv6: https://developers.cloudflare.com/network/ipv6-compatibility/
- Cloudflare CDN terms: https://www.cloudflare.com/service-specific-terms-application-services/
