<script lang="ts">
	import { Tsd, setLocale, localeStore } from '@tinyland/tsd/svelte';
	import { onMount, onDestroy } from 'svelte';
	import { goto } from '$app/navigation';
	
	export let data;
	
	let currentLocale = data.locale;
	let unsubscribe: () => void;
	let connectionInfo: any = {};
	let showDebug = true;
	let isNavigating = false;
	
	onMount(() => {
		unsubscribe = localeStore.subscribe((locale) => {
			currentLocale = locale;
		});
		
		// Get connection info from global client
		const checkClient = () => {
			const client = (window as any).__TSD_GRPC_CLIENT__;
			if (client && client.envoyConfig) {
				connectionInfo = client.envoyConfig;
			} else {
				setTimeout(checkClient, 100);
			}
		};
		checkClient();
	});
	
	onDestroy(() => {
		if (unsubscribe) unsubscribe();
	});
	
	async function switchLocale(locale: string) {
		if (isNavigating || locale === currentLocale) return;
		
		isNavigating = true;
		try {
			// Update locale in store first
			setLocale(locale);
			// Then update URL without full page reload
			await goto(`/${locale}/tsd-demo`, { replaceState: true, noScroll: true, keepFocus: true });
		} finally {
			isNavigating = false;
		}
	}
</script>

<div class="container">
	<header>
		<h1><Tsd>Welcome to TSd Demo</Tsd></h1>
		<div class="connection-status">
			{#if connectionInfo.isEnvoy}
				<span class="status envoy">🚀 Envoy Proxy</span>
			{:else}
				<span class="status http">🌐 HTTP/JSON</span>
			{/if}
			<span class="env">{connectionInfo.environment || 'loading...'}</span>
		</div>
	</header>

	<nav>
		<button on:click={() => switchLocale('en')} class:active={currentLocale === 'en'} disabled={isNavigating}>
			English
		</button>
		<button on:click={() => switchLocale('es')} class:active={currentLocale === 'es'} disabled={isNavigating}>
			Español
		</button>
		<button on:click={() => switchLocale('fr')} class:active={currentLocale === 'fr'} disabled={isNavigating}>
			Français
		</button>
		<button on:click={() => switchLocale('de')} class:active={currentLocale === 'de'} disabled={isNavigating}>
			Deutsch
		</button>
		<button on:click={() => switchLocale('ja')} class:active={currentLocale === 'ja'} disabled={isNavigating}>
			日本語
		</button>
		<button on:click={() => switchLocale('zh')} class:active={currentLocale === 'zh'} disabled={isNavigating}>
			中文
		</button>
	</nav>

	<main class:loading={isNavigating}>
		<section class="demo-section">
			<h2><Tsd>Translation Examples</Tsd></h2>
			
			<div class="example">
				<h3><Tsd>Simple Text</Tsd></h3>
				<p><Tsd>Hello, world!</Tsd></p>
				<p><Tsd>This is a test of the TSd translation system.</Tsd></p>
			</div>
			
			<div class="example">
				<h3><Tsd>Common Phrases</Tsd></h3>
				<p><Tsd>Welcome</Tsd></p>
				<p><Tsd>Thank you</Tsd></p>
				<p><Tsd>Good morning</Tsd></p>
				<p><Tsd>Goodbye</Tsd></p>
			</div>
			
			<div class="example">
				<h3><Tsd>Longer Text</Tsd></h3>
				<p><Tsd>This translation system uses just-in-time translation with caching to provide fast, efficient multilingual support for your application.</Tsd></p>
			</div>
		</section>
		
		<section class="info-section">
			<h2>Current Status</h2>
			<ul>
				<li>Locale: <strong>{currentLocale}</strong></li>
				<li>Protocol: <strong>{connectionInfo.protocol || 'loading...'}</strong></li>
				<li>Environment: <strong>{connectionInfo.environment || 'loading...'}</strong></li>
				<li>Envoy: <strong>{connectionInfo.isEnvoy ? 'Yes' : 'No'}</strong></li>
			</ul>
			
			<button on:click={() => showDebug = !showDebug} class="debug-toggle">
				{showDebug ? 'Hide' : 'Show'} Console Logs
			</button>
			
			{#if showDebug}
				<div class="debug-info">
					<p>Open your browser console to see detailed translation logs including:</p>
					<ul>
						<li>🚀 Envoy proxy detection</li>
						<li>📤 Translation requests with timing</li>
						<li>📥 Translation responses</li>
						<li>🔔 Real-time update notifications</li>
						<li>⚡ Performance metrics</li>
					</ul>
				</div>
			{/if}
		</section>
	</main>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 2rem;
		font-family: system-ui, -apple-system, sans-serif;
	}

	header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
	}

	h1 {
		color: #ff3e00;
		margin: 0;
	}

	.connection-status {
		display: flex;
		gap: 1rem;
		align-items: center;
		font-size: 0.9rem;
	}

	.status {
		padding: 0.25rem 0.75rem;
		border-radius: 20px;
		font-weight: 600;
	}

	.status.envoy {
		background: #e3f2fd;
		color: #1976d2;
	}

	.status.http {
		background: #f3e5f5;
		color: #7b1fa2;
	}

	.env {
		color: #666;
		text-transform: capitalize;
	}

	nav {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 3rem;
		flex-wrap: wrap;
	}

	button {
		padding: 0.5rem 1rem;
		border: 1px solid #ccc;
		background: white;
		cursor: pointer;
		border-radius: 4px;
		transition: all 0.2s;
		position: relative;
	}
	
	button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	button:hover {
		background: #f0f0f0;
	}

	button.active {
		background: #ff3e00;
		color: white;
		border-color: #ff3e00;
	}

	.demo-section {
		background: #f9f9f9;
		padding: 2rem;
		border-radius: 8px;
		margin-bottom: 2rem;
	}

	.example {
		background: white;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		border-radius: 4px;
		box-shadow: 0 1px 3px rgba(0,0,0,0.1);
	}

	.example:last-child {
		margin-bottom: 0;
	}

	.example h3 {
		margin-top: 0;
		color: #333;
	}

	.info-section {
		background: white;
		padding: 2rem;
		border-radius: 8px;
		box-shadow: 0 2px 4px rgba(0,0,0,0.1);
	}

	.info-section h2 {
		margin-top: 0;
		color: #333;
	}

	.info-section ul {
		list-style: none;
		padding: 0;
	}

	.info-section li {
		padding: 0.5rem 0;
		border-bottom: 1px solid #eee;
	}

	.debug-toggle {
		margin-top: 1rem;
		background: #333;
		color: white;
		border-color: #333;
	}

	.debug-toggle:hover {
		background: #555;
	}

	.debug-info {
		margin-top: 1rem;
		padding: 1rem;
		background: #f5f5f5;
		border-radius: 4px;
		font-size: 0.9rem;
	}

	.debug-info ul {
		margin: 0.5rem 0 0 1.5rem;
		padding: 0;
		list-style: disc;
	}

	.debug-info li {
		border: none;
		padding: 0.25rem 0;
	}
	
	main {
		transition: opacity 0.2s ease-in-out;
	}
	
	main.loading {
		opacity: 0.6;
		pointer-events: none;
	}
</style>