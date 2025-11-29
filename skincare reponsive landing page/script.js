// Clean, modular, defensive script for the landing page
// Features: product rendering, cart + wishlist persistence, mini-cart, checkout modal,
// product modal, search & filter, toasts, dark-mode, back-to-top, and accessibility helpers.

document.addEventListener('DOMContentLoaded', () => {
  // ----- Data -----
  const products = [
    { name: 'CeraVe Cleanser', price: 10000, originalPrice: 12500, image: 'images/ceravecleanser.webp', description: 'Gentle cleanser that brightens and hydrates dull skin.', benefits: ['Removes impurities','Hydrates skin','Suitable for all skin types','Non-foaming formula'], inStock: true, sale: '20% OFF' },
    { name: 'The ordinary Toner', price: 27000, image: 'images/theordinary.webp', description: 'Deep nourishment for everyday glow with essential ingredients.', benefits: ['Balances pH','Deep hydration','Prepares skin for serums','Lightweight formula'], inStock: true },
    { name: 'Anua Serum', price: 26000, image: 'images/anuaserum.png', description: 'Velvety smooth hydration for all skin types.', benefits: ['Intense hydration','Reduces fine lines','Brightens complexion','Fast absorption'], inStock: false },
    { name: 'Medicude Moisturerizer', price: 40800, originalPrice: 48000, image: 'images/medicude.webp', description: 'Rich moisturizer that deeply nourishes and protects skin.', benefits: ['Long-lasting moisture','Strengthens barrier','Anti-aging properties','Luxury feel'], inStock: true, sale: '15% OFF' }
  ];

  // ----- State & Selectors -----
  let cart = []; // array of {name, price}
  let wishlist = [];
  let total = 0;

  const qs = sel => document.querySelector(sel);
  const qsa = sel => Array.from(document.querySelectorAll(sel));

  const productGrid = qs('#product-grid');
  const cartItemsEl = qs('#cart-items');
  const cartTotalEl = qs('#cart-total');
  const cartBadge = qs('#cart-badge');
  const miniCart = qs('#mini-cart');
  const searchInput = qs('#search-input');
  const priceFilterEl = qs('#price-filter');
  const productModal = qs('#product-modal');
  const modalImage = qs('#modal-image');
  const modalTitle = qs('#modal-title');
  const modalDescription = qs('#modal-description');
  const modalPrice = qs('#modal-price');
  const modalBenefits = qs('#modal-benefits');
  const shareWhatsapp = qs('#share-whatsapp');
  const shareEmail = qs('#share-email');
  const shareCopy = qs('#share-copy');
  const checkoutModal = qs('#checkout-modal');
  const checkoutItems = qs('#checkout-items');
  const checkoutTotalEl = qs('#checkout-total');
  const checkoutFooterTotal = qs('#checkout-footer-total');
  const checkoutBtn = qs('#checkout-btn');
  const checkoutClose = qs('#checkout-close');
  const checkoutForm = qs('#checkout-form');
  const checkoutFooterComplete = qs('#checkout-complete-footer');
  const backToTopBtn = qs('#back-to-top');
  const newsletterForm = qs('#newsletter-form');
  const newsletterMessage = qs('#newsletter-message');
  const darkModeToggle = qs('#dark-mode-toggle');
  const hamburger = qs('#hamburger');
  const navLinks = qs('#nav-links');

  // Defensive checks
  if (!productGrid) console.error('Missing #product-grid element — products cannot render');

  // ----- Persistence helpers -----
  const CART_KEY = 'glow_cart';
  const WISHLIST_KEY = 'glow_wishlist';
  const DARK_KEY = 'glow_darkMode';

  function saveCart() { try { localStorage.setItem(CART_KEY, JSON.stringify({cart, total})); } catch (e) {} }
  function loadCart() { try { const s = localStorage.getItem(CART_KEY); if (s) { const parsed = JSON.parse(s); cart = parsed.cart || []; total = parsed.total || 0; } } catch (e) {} }
  function saveWishlist() { try { localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist)); } catch (e) {} }
  function loadWishlist() { try { const s = localStorage.getItem(WISHLIST_KEY); if (s) wishlist = JSON.parse(s) || []; } catch (e) {} }
  function saveDarkMode(val) { try { localStorage.setItem(DARK_KEY, val ? '1' : '0'); } catch (e) {} }
  function loadDarkMode() { try { return localStorage.getItem(DARK_KEY) === '1'; } catch(e) { return false; } }

  // ----- UI helpers -----
  function showToast(message, type = 'success') {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.textContent = message;
    document.body.appendChild(t);
    requestAnimationFrame(()=> t.classList.add('visible'));
    setTimeout(()=> { t.classList.remove('visible'); setTimeout(()=> t.remove(), 300); }, 2500);
  }

  function updateCartUI() {
    if (!cartItemsEl || !cartBadge || !cartTotalEl) return;
    cartItemsEl.innerHTML = '';
    const map = {};
    cart.forEach(item => map[item.name] = (map[item.name] || 0) + 1);
    Object.keys(map).forEach(name => {
      const li = document.createElement('li');
      li.className = 'cart-item';
      li.innerHTML = `<span>${name} × ${map[name]}</span><button class="remove-item" data-name="${name}">Remove</button>`;
      cartItemsEl.appendChild(li);
    });
    cartBadge.textContent = cart.length;
    total = cart.reduce((s,i)=> s + i.price, 0);
    cartTotalEl.textContent = `Total: ₦${total.toLocaleString()}`;
    renderMiniCart();
  }

  function renderMiniCart() {
    if (!miniCart) return;
    if (cart.length === 0) { miniCart.innerHTML = '<p>Your cart is empty</p>'; return; }
    const counts = {};
    cart.forEach(c=> counts[c.name] = (counts[c.name]||0)+1);
    miniCart.innerHTML = `<h4>Recent Items</h4>` + Object.keys(counts).map(k=> `<div class="mini-item"><span>${k}</span><span>×${counts[k]}</span></div>`).join('') + `<div style="margin-top:.6rem"><strong>Total: ₦${total.toLocaleString()}</strong></div>`;
  }

  function addToCart(name, price, qty = 1) {
    for (let i=0;i<qty;i++) cart.push({name, price});
    saveCart();
    updateCartUI();
    showToast(`✓ ${name} added to cart`);
  }

  function removeFromCart(name) {
    const idx = cart.findIndex(i=>i.name===name);
    if (idx === -1) return;
    cart.splice(idx,1);
    saveCart();
    updateCartUI();
    showToast('Removed from cart');
  }

  // ----- Product rendering -----
  function renderProducts(list = products) {
    if (!productGrid) return;
    productGrid.innerHTML = '';
    list.forEach(p => {
      const card = document.createElement('article');
      card.className = 'product-card';
      if (!p.inStock) card.classList.add('out-of-stock');
      card.innerHTML = `
        ${p.sale ? `<div class="sale-badge">${p.sale}</div>` : ''}
        <button class="wishlist-btn" data-product="${p.name}" aria-label="Add ${p.name} to wishlist">${ wishlist.includes(p.name) ? '♥' : '♡'}</button>
        <img class="product-image" src="${p.image}" alt="${p.name}" loading="lazy">
        <h3>${p.name}</h3>
        <p class="desc">${p.description}</p>
        <p class="price">${p.originalPrice ? `<strike>₦${p.originalPrice.toLocaleString()}</strike> ` : ''}₦${p.price.toLocaleString()}</p>
        <div class="quantity-selector">
          <button class="qty-btn minus">−</button>
          <input class="qty-input" type="number" value="1" min="1">
          <button class="qty-btn plus">+</button>
        </div>
        <div class="actions">
          <button class="add-cart" data-name="${p.name}" data-price="${p.price}" ${!p.inStock ? 'disabled' : ''}>Add to Cart</button>
          <button class="view-details" data-name="${p.name}">View Details</button>
        </div>
      `;
      productGrid.appendChild(card);
    });
  }

  // ----- Event delegation for product grid -----
  if (productGrid) {
    productGrid.addEventListener('click', (e) => {
      const target = e.target;
      // Add to cart
      if (target.closest('.add-cart')) {
        const btn = target.closest('.add-cart');
        const card = btn.closest('.product-card');
        const name = btn.dataset.name;
        const price = Number(btn.dataset.price || 0);
        const qtyInput = card.querySelector('.qty-input');
        const qty = qtyInput ? Math.max(1, parseInt(qtyInput.value)||1) : 1;
        addToCart(name, price, qty);
        if (qtyInput) qtyInput.value = 1;
        return;
      }

      // Wishlist toggle
      if (target.closest('.wishlist-btn')) {
        const btn = target.closest('.wishlist-btn');
        const name = btn.dataset.product;
        if (!name) return;
        if (wishlist.includes(name)) {
          wishlist = wishlist.filter(x=>x!==name);
          btn.textContent = '♡';
          showToast('Removed from wishlist');
        } else {
          wishlist.push(name);
          btn.textContent = '♥';
          showToast('Added to wishlist');
        }
        saveWishlist();
        return;
      }

      // View details
      if (target.closest('.view-details')) {
        const btn = target.closest('.view-details');
        const name = btn.dataset.name;
        const product = products.find(p=>p.name===name);
        if (!product) return;
        if (modalImage) modalImage.src = product.image;
        if (modalTitle) modalTitle.textContent = product.name;
        if (modalDescription) modalDescription.textContent = product.description;
        if (modalPrice) modalPrice.textContent = `₦${product.price.toLocaleString()}`;
        if (modalBenefits) {
          modalBenefits.innerHTML = '';
          product.benefits.forEach(b=> { const li = document.createElement('li'); li.textContent = b; modalBenefits.appendChild(li); });
        }
        if (productModal) { productModal.style.display = 'block'; document.body.style.overflow = 'hidden'; productModal.focus(); }
        // share handlers
        const link = `${location.origin}${location.pathname}?product=${encodeURIComponent(product.name)}`;
        if (shareWhatsapp) shareWhatsapp.onclick = () => window.open(`https://wa.me/?text=${encodeURIComponent(product.name + ' ' + link)}`,'_blank');
        if (shareEmail) shareEmail.onclick = () => location.href = `mailto:?subject=${encodeURIComponent('Check this product')}&body=${encodeURIComponent(product.name + ' ' + link)}`;
        if (shareCopy) shareCopy.onclick = () => { navigator.clipboard?.writeText(link); showToast('Link copied'); };
        return;
      }

      // Qty buttons
      if (target.closest('.qty-btn')) {
        const btn = target.closest('.qty-btn');
        const card = btn.closest('.product-card');
        const input = card.querySelector('.qty-input');
        if (!input) return;
        let val = Math.max(1, parseInt(input.value)||1);
        if (btn.classList.contains('plus')) val++;
        if (btn.classList.contains('minus')) val = Math.max(1, val-1);
        input.value = val;
      }
    });
  }

  // Remove item from cart (delegated)
  document.addEventListener('click', (e) => {
    const rem = e.target.closest('.remove-item');
    if (!rem) return;
    const name = rem.dataset.name;
    if (!name) return;
    removeFromCart(name);
  });

  // Mini-cart toggle
  if (cartBadge && miniCart) {
    cartBadge.addEventListener('click', (e) => { miniCart.classList.toggle('show'); cartBadge.setAttribute('aria-expanded', miniCart.classList.contains('show')); miniCart.setAttribute('aria-hidden', !miniCart.classList.contains('show')); });
    document.addEventListener('click', (e) => { if (!miniCart.contains(e.target) && !cartBadge.contains(e.target)) miniCart.classList.remove('show'); });
  }

  // ----- Search & Filter -----
  function filterProducts() {
    const term = (searchInput?.value || '').toLowerCase().trim();
    const priceRange = (priceFilterEl?.value || '');
    let list = products.filter(p => p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term));
    if (priceRange) {
      const [min,max] = priceRange.split('-').map(Number);
      list = list.filter(p => p.price >= (min||0) && p.price <= (max||Infinity));
    }
    renderProducts(list);
  }
  function debounce(fn, wait=200){ let t; return (...a)=>{ clearTimeout(t); t = setTimeout(()=>fn(...a), wait); }; }
  if (searchInput) searchInput.addEventListener('input', debounce(filterProducts,200));
  if (priceFilterEl) priceFilterEl.addEventListener('change', filterProducts);

  // ----- Product modal closing -----
  if (productModal) {
    productModal.addEventListener('click', (e)=> { if (e.target === productModal || e.target.classList.contains('close')) { productModal.style.display='none'; document.body.style.overflow=''; } });
    window.addEventListener('keydown', (e) => { if (e.key === 'Escape' && productModal.style.display === 'block') { productModal.style.display='none'; document.body.style.overflow=''; } });
  }

  // ----- Checkout -----
  function populateCheckout() {
    if (!checkoutItems || !checkoutTotalEl || !checkoutFooterTotal) return;
    checkoutItems.innerHTML = '';
    const agg = {};
    cart.forEach(i => agg[i.name] = (agg[i.name]||0)+1);
    Object.keys(agg).forEach(name => {
      const price = cart.find(c=>c.name===name).price;
      const qty = agg[name];
      const div = document.createElement('div');
      div.className = 'checkout-item';
      div.innerHTML = `<strong>${name}</strong><span>₦${price.toLocaleString()} × ${qty} = ₦${(price*qty).toLocaleString()}</span>`;
      checkoutItems.appendChild(div);
    });
    checkoutTotalEl.textContent = `₦${total.toLocaleString()}`;
    checkoutFooterTotal.textContent = `Total: ₦${total.toLocaleString()}`;
  }

  if (checkoutBtn && checkoutModal) {
    checkoutBtn.addEventListener('click', ()=>{
      if (cart.length === 0) { alert('Your cart is empty'); return; }
      populateCheckout();
      checkoutModal.style.display = 'block'; document.body.style.overflow = 'hidden';
    });
  }
  if (checkoutClose && checkoutModal) checkoutClose.addEventListener('click', ()=> { checkoutModal.style.display='none'; document.body.style.overflow=''; });
  if (checkoutForm) {
    checkoutForm.addEventListener('submit', (e)=>{
      e.preventDefault();
      // simulate processing
      const formBtns = checkoutForm.querySelectorAll('button[type="submit"], .complete-order-btn');
      formBtns.forEach(b=>b.disabled = true);
      setTimeout(()=>{
        showToast('Order completed — thank you!');
        cart = []; total = 0; saveCart(); updateCartUI();
        checkoutModal.style.display = 'none'; document.body.style.overflow='';
        checkoutForm.reset();
        formBtns.forEach(b=>b.disabled = false);
      }, 1200);
    });
  }

  // footer complete button
  if (checkoutFooterComplete && checkoutForm) checkoutFooterComplete.addEventListener('click', ()=> checkoutForm.requestSubmit ? checkoutForm.requestSubmit() : checkoutForm.dispatchEvent(new Event('submit', {cancelable:true})));

  // ----- Back to top -----
  if (backToTopBtn) {
    window.addEventListener('scroll', ()=> backToTopBtn.classList.toggle('show', window.pageYOffset > 300));
    backToTopBtn.addEventListener('click', ()=> window.scrollTo({top:0, behavior:'smooth'}));
  }

  // ----- Newsletter -----
  if (newsletterForm) newsletterForm.addEventListener('submit', (e)=>{ e.preventDefault(); if (newsletterMessage) { newsletterMessage.textContent = '✓ Thank you! Check your email for your 15% discount code!'; } setTimeout(()=> { newsletterForm.reset(); if (newsletterMessage) newsletterMessage.textContent = ''; }, 3000); });

  // ----- Dark mode -----
  if (darkModeToggle) {
    const setDark = (v) => { document.body.classList.toggle('dark-mode', !!v); saveDarkMode(!!v); };
    setDark(loadDarkMode());
    darkModeToggle.addEventListener('click', ()=> setDark(!document.body.classList.contains('dark-mode')));
  }

  // ----- Hamburger mobile nav -----
  if (hamburger && navLinks) hamburger.addEventListener('click', ()=> navLinks.classList.toggle('open'));

  // ----- Init load -----
  loadWishlist();
  loadCart();
  renderProducts();
  updateCartUI();

  console.log('%cScript initialized — products rendered', 'color:green;font-weight:700');
});
