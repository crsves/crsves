window.linkShortener = window.linkShortener || (() => ({
  tab: 'shorten',
  url: '',
  password: '',
  customCode: '',
  expiresInDays: '',
  showAdv: false,
  loading: false,
  error: null,
  result: null,
  copied: false,
  statsCode: '',
  statsToken: '',
  statsLoading: false,
  statsError: null,
  stats: null,
  turnstileSiteKey: null,
  turnstileToken: null,
  _tId: null,

  async init() {
    try {
      const cfg = await fetch('/api/config').then((response) => response.json());
      if (cfg.turnstile_site_key) {
        this.turnstileSiteKey = cfg.turnstile_site_key;
        this.$nextTick(() => this._loadTS());
      }
    } catch {}
  },

  _loadTS() {
    const self = this;

    function tryRender() {
      if (!window.turnstile || self._tId !== null || !self.$refs?.ts) return;
      self._tId = window.turnstile.render(self.$refs.ts, {
        sitekey: self.turnstileSiteKey,
        callback: (token) => {
          self.turnstileToken = token;
        },
        'expired-callback': () => {
          self.turnstileToken = null;
        },
      });
    }

    if (window.turnstile) {
      tryRender();
      return;
    }

    if (!document.getElementById('_ts_script')) {
      const script = document.createElement('script');
      script.id = '_ts_script';
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js';
      script.onload = tryRender;
      document.head.appendChild(script);
    }

    setTimeout(tryRender, 600);
  },

  _resetTS() {
    if (window.turnstile && this._tId !== null) {
      window.turnstile.reset(this._tId);
      this.turnstileToken = null;
    }
  },

  async shorten() {
    this.error = null;
    if (this.turnstileSiteKey && !this.turnstileToken) {
      this.error = 'Please complete the CAPTCHA.';
      return;
    }

    this.loading = true;
    try {
      const body = { url: this.url };
      if (this.password) body.password = this.password;
      if (this.customCode) body.custom_code = this.customCode;
      if (this.expiresInDays) body.expires_in_days = parseInt(this.expiresInDays, 10);
      if (this.turnstileToken) body.cf_turnstile_token = this.turnstileToken;

      const res = await fetch('/api/links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const data = await res.json();

      if (!res.ok) {
        this.error = data.error || 'Something went wrong.';
        this._resetTS();
        return;
      }

      this.result = data;
      this.url = '';
      this.password = '';
      this.customCode = '';
      this.expiresInDays = '';
      this.showAdv = false;
      this._resetTS();
    } catch {
      this.error = 'Network error. Please try again.';
      this._resetTS();
    } finally {
      this.loading = false;
    }
  },

  async copyUrl() {
    if (!this.result) return;
    await navigator.clipboard.writeText(this.result.short_url);
    this.copied = true;
    setTimeout(() => {
      this.copied = false;
    }, 2000);
  },

  reset() {
    this.result = null;
    this.error = null;
  },

  async loadStats() {
    this.statsError = null;
    this.stats = null;
    if (!this.statsCode || !this.statsToken) {
      this.statsError = 'Enter both the link code and your deletion token.';
      return;
    }

    this.statsLoading = true;
    try {
      const res = await fetch(
        `/api/links/${encodeURIComponent(this.statsCode)}/stats?token=${encodeURIComponent(this.statsToken)}`
      );
      const data = await res.json();
      if (!res.ok) {
        this.statsError = data.error || 'Error loading stats.';
        return;
      }
      this.stats = data;
    } catch {
      this.statsError = 'Network error.';
    } finally {
      this.statsLoading = false;
    }
  },

  async deleteLink() {
    if (!this.stats) return;
    if (!confirm(`Delete /${this.stats.code}? This cannot be undone.`)) return;

    try {
      const res = await fetch(
        `/api/links/${encodeURIComponent(this.stats.code)}?token=${encodeURIComponent(this.statsToken)}`,
        { method: 'DELETE' }
      );
      const data = await res.json();
      if (!res.ok) {
        this.statsError = data.error || 'Error deleting.';
        return;
      }
      this.stats = null;
      this.statsCode = '';
      this.statsToken = '';
      this.statsError = null;
      alert('Link deleted.');
    } catch {
      this.statsError = 'Network error.';
    }
  },

  formatDate(ts) {
    if (!ts) return '—';
    return new Date(ts * 1000).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  },
}));
