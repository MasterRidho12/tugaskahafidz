/**
 * Size Chart Interactive Component
 * Handles:
 * - Accessible Modal Dialog (Keyboard Trap, ESC, Focus Management)
 * - Unit Conversion (cm <-> inch, localStorage persistence)
 * - Dynamic Table Highlights & Size Recommendation
 */
(function() {
  'use strict';

  const STORAGE_KEY = 'kainara_size_chart_unit';
  const CM_TO_INCH = 2.54;

  class SizeChartComponent {
    constructor(wrapper) {
      this.wrapper = wrapper;
      this.blockId = wrapper.dataset.blockId;
      this.defaultUnit = wrapper.dataset.defaultUnit || 'cm';
      this.triggerBtn = wrapper.querySelector('.size-chart-trigger');
      this.modal = wrapper.querySelector('.size-chart-modal');
      this.closeBtn = wrapper.querySelector('.size-chart-modal__close-btn');
      this.overlay = wrapper.querySelector('.size-chart-modal__overlay');
      this.unitButtons = wrapper.querySelectorAll('.size-chart-unit-toggle__btn');
      this.table = wrapper.querySelector('.size-chart-table');
      this.tableWrapper = wrapper.querySelector('.size-chart-table-wrapper');
      this.dataCells = wrapper.querySelectorAll('td[data-cm]');
      this.lastFocusedElement = null;

      // Recommender elements
      this.recommenderInput = wrapper.querySelector('.size-chart-recommender__input');
      this.recommenderBtn = wrapper.querySelector('.size-chart-recommender__button');
      this.recommenderFeedback = wrapper.querySelector('.size-chart-recommender__feedback');

      this.currentUnit = this.getSavedUnit();

      this.init();
    }

    init() {
      if (!this.modal || !this.triggerBtn) return;

      // Apply initial unit
      this.applyUnit(this.currentUnit);

      // Event listeners for modal
      this.triggerBtn.addEventListener('click', () => this.openModal());

      if (this.closeBtn) {
        this.closeBtn.addEventListener('click', () => this.closeModal());
      }

      if (this.overlay) {
        this.overlay.addEventListener('click', () => this.closeModal());
      }

      // Unit toggle listeners
      this.unitButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
          const unit = e.currentTarget.dataset.unit;
          if (unit && unit !== this.currentUnit) {
            this.setUnit(unit);
          }
        });
      });

      // Keydown listener for modal accessibility
      this.modal.addEventListener('keydown', (e) => this.handleKeydown(e));

      // Recommender listener
      if (this.recommenderBtn && this.recommenderInput) {
        this.recommenderBtn.addEventListener('click', () => this.handleRecommendation());
        this.recommenderInput.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            this.handleRecommendation();
          }
        });
      }
    }

    getSavedUnit() {
      try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved === 'cm' || saved === 'inch') {
          return saved;
        }
      } catch (err) {
        // localStorage disabled or security error
      }
      return this.defaultUnit;
    }

    setUnit(unit) {
      this.currentUnit = unit;
      try {
        localStorage.setItem(STORAGE_KEY, unit);
      } catch (err) {
        // Ignore localStorage error
      }
      this.applyUnit(unit);
    }

    applyUnit(unit) {
      // Update toggle buttons UI
      this.unitButtons.forEach(btn => {
        const isCurrent = btn.dataset.unit === unit;
        btn.classList.toggle('is-active', isCurrent);
        btn.setAttribute('aria-pressed', isCurrent ? 'true' : 'false');
      });

      // Convert cells
      this.dataCells.forEach(cell => {
        const cmVal = parseFloat(cell.dataset.cm);
        if (isNaN(cmVal)) return;

        if (unit === 'inch') {
          const inchVal = (cmVal / CM_TO_INCH).toFixed(1);
          cell.textContent = inchVal;
        } else {
          // If cm has decimal (e.g. 70.5), show it, otherwise clean
          cell.textContent = cmVal % 1 === 0 ? cmVal.toString() : cmVal.toFixed(1);
        }
      });
    }

    openModal() {
      this.lastFocusedElement = document.activeElement;

      // Lock body scroll
      document.documentElement.classList.add('size-chart-open');
      document.body.classList.add('size-chart-open');

      this.modal.classList.add('is-open');
      this.modal.setAttribute('aria-hidden', 'false');
      this.triggerBtn.setAttribute('aria-expanded', 'true');

      if (typeof this.modal.showModal === 'function') {
        try {
          this.modal.showModal();
        } catch (e) {
          // Native dialog already open fallback
        }
      }

      // Move focus into the modal
      window.requestAnimationFrame(() => {
        if (this.closeBtn) {
          this.closeBtn.focus();
        } else {
          this.modal.focus();
        }
      });
    }

    closeModal() {
      // Unlock body scroll
      document.documentElement.classList.remove('size-chart-open');
      document.body.classList.remove('size-chart-open');

      this.modal.classList.remove('is-open');
      this.modal.setAttribute('aria-hidden', 'true');
      this.triggerBtn.setAttribute('aria-expanded', 'false');

      if (typeof this.modal.close === 'function') {
        try {
          this.modal.close();
        } catch (e) {
          // Fallback
        }
      }

      // Return focus to trigger button
      if (this.lastFocusedElement && typeof this.lastFocusedElement.focus === 'function') {
        this.lastFocusedElement.focus();
      }
    }

    handleKeydown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        this.closeModal();
        return;
      }

      // Trap focus inside modal
      if (e.key === 'Tab') {
        const focusableElements = this.modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const focusable = Array.prototype.filter.call(focusableElements, el => {
          return !el.disabled && el.offsetParent !== null;
        });

        if (focusable.length === 0) return;

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === firstElement || !this.modal.contains(document.activeElement)) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    }

    handleRecommendation() {
      if (!this.recommenderInput || !this.recommenderFeedback) return;

      const rawVal = parseFloat(this.recommenderInput.value.replace(',', '.'));
      const rows = this.table ? this.table.querySelectorAll('tbody tr') : [];

      // Reset previous highlights
      rows.forEach(r => r.classList.remove('is-highlighted'));
      this.recommenderFeedback.className = 'size-chart-recommender__feedback';

      if (isNaN(rawVal) || rawVal <= 0) {
        this.recommenderFeedback.textContent = 'Silakan masukkan angka lingkar dada yang valid.';
        this.recommenderFeedback.classList.add('is-error');
        return;
      }

      // If user input is in inches (optional detection or note), convert if needed.
      // Default prompt states chest in cm.
      const userCm = rawVal;
      let matchedRow = null;
      let bestDiff = Infinity;

      // Find size where garment chest is equal or comfortably larger (ease of 2-6 cm is ideal)
      rows.forEach(row => {
        const rowChest = parseFloat(row.dataset.chest);
        if (!isNaN(rowChest)) {
          if (rowChest >= userCm && (rowChest - userCm) < bestDiff) {
            bestDiff = rowChest - userCm;
            matchedRow = row;
          }
        }
      });

      if (matchedRow) {
        matchedRow.classList.add('is-highlighted');
        const sizeLabel = matchedRow.dataset.rowSize || '';
        this.recommenderFeedback.textContent = `Ukuran yang disarankan: ${sizeLabel}`;
        this.recommenderFeedback.classList.add('is-success');

        // Scroll row into view smoothly
        matchedRow.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      } else {
        // Exceeds available sizes or no chest data
        this.recommenderFeedback.textContent = 'Ukuran Anda di luar rentang standar kami. Silakan hubungi kami untuk custom size.';
        this.recommenderFeedback.classList.add('is-error');
      }
    }
  }

  function initSizeCharts() {
    const components = document.querySelectorAll('.size-chart-wrapper:not([data-initialized])');
    components.forEach(wrapper => {
      wrapper.setAttribute('data-initialized', 'true');
      new SizeChartComponent(wrapper);
    });
  }

  // Auto-init on DOMContentLoaded and theme editor events
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSizeCharts);
  } else {
    initSizeCharts();
  }

  document.addEventListener('shopify:section:load', initSizeCharts);
})();
