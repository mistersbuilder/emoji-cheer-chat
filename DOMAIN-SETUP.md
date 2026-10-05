# Custom Domain Setup for GitHub Pages

To connect your custom domain (e.g. `chat.yourdomain.com` or `yourdomain.com`):

1. **DNS Settings at your domain registrar:**
   - For a subdomain (e.g. `chat.yourdomain.com`):
     - Add a `CNAME` record pointing to `mistersbuilder.github.io`.
   - For an apex domain (e.g. `yourdomain.com`):
     - Add `A` records pointing to GitHub Pages IP addresses:
       - `185.199.108.153`
       - `185.199.109.153`
       - `185.199.110.153`
       - `185.199.111.153`

2. **Enable in GitHub Repository:**
   - In GitHub Settings > Pages > Custom domain, enter your domain name.
   - Or create a file named `CNAME` in the repository root containing your domain (e.g. `echo "chat.yourdomain.com" > CNAME`).
   - GitHub Pages will automatically provision an HTTPS certificate.
