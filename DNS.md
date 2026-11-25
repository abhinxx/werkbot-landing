# DNS: point werkbot.xyz at Vercel (Hostinger)

Checked 25 Nov 2026 with `vercel domains verify` and `dig`. Vercel already has `werkbot.xyz` and `www.werkbot.xyz` attached to the project `werkbot-landing`. Only DNS is missing. Nameservers stay at Hostinger (`artemis.dns-parking.com`, `hermes.dns-parking.com`), so you edit the records inside Hostinger, you do not change nameservers.

## What exists now

| Type | Name | Value | Action |
|---|---|---|---|
| A | `@` | `2.57.91.91` (Hostinger parking page) | change |
| CNAME | `www` | `werkbot.xyz` | change |
| MX | `@` | `mx1.hostinger.com` (5), `mx2.hostinger.com` (10) | leave |
| TXT | `@` | `v=spf1 include:_spf.mail.hostinger.com ~all` | leave |
| TXT | `_dmarc` | `v=DMARC1; p=none` | leave |
| CNAME | `hostingermail-a._domainkey` | `hostingermail-a.dkim.mail.hostinger.com` | leave |
| CNAME | `hostingermail-b._domainkey` | `hostingermail-b.dkim.mail.hostinger.com` | leave |
| CNAME | `autoconfig` | `autoconfig.mail.hostinger.com` | leave |
| CNAME | `autodiscover` | `autodiscover.mail.hostinger.com` | leave |

No AAAA and no CAA record exists. Good.

## What to set

| Type | Name | Value | TTL |
|---|---|---|---|
| A | `@` | `216.198.79.1` | 300 or default |
| A | `@` | `64.29.17.1` | 300 or default |
| CNAME | `www` | `bc3422714175d7be.vercel-dns-017.com` | 300 or default |

(Values are what Vercel returned for this project. `76.76.21.21` for the A record and `cname.vercel-dns.com` for www are Vercel's older values and also work, but use the ones above.)

## Steps in Hostinger

1. hPanel, Domains, `werkbot.xyz`, DNS / Nameservers, DNS records.
2. Find the A record for `@` with value `2.57.91.91`. Edit it: value `216.198.79.1`, save. (Or delete it and add the new one.)
3. Add a second A record: name `@`, value `64.29.17.1`. Two A records on `@` is intended.
4. Find the CNAME record for `www` (value `werkbot.xyz`). Edit it: value `bc3422714175d7be.vercel-dns-017.com`, save. If Hostinger wants a trailing dot, add it.
5. Wait 5 to 30 minutes. The Hostinger parking page keeps showing until the A record has changed.

## Do not touch

- MX records (Hostinger mail). Your `abhi@werkbot.xyz` inbox depends on them.
- The TXT records for SPF and `_dmarc`.
- The `hostingermail-a/b._domainkey`, `autoconfig` and `autodiscover` CNAMEs.
- Nameservers. Do not switch to `ns1.vercel-dns.com`: that would drop all the mail records above unless you recreate them.
- Do not add an AAAA record for `@` that points to the parking host.

## Check afterwards

```
dig +short werkbot.xyz            # 216.198.79.1 and 64.29.17.1
dig +short www.werkbot.xyz        # bc3422714175d7be.vercel-dns-017.com. then Vercel IPs
dig +short MX werkbot.xyz         # still mx1 and mx2.hostinger.com
```

Then open https://werkbot.xyz and https://werkbot.xyz/technology. `https://www.werkbot.xyz` redirects to `https://werkbot.xyz` (rule in `vercel.json`). Vercel issues the HTTPS certificate by itself after the records resolve, usually within a few minutes. Run `npx vercel domains verify werkbot.xyz` to see the status.
