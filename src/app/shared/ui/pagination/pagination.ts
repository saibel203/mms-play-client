import { Component, computed, input, output } from '@angular/core';

/** A page number, or `null` for a "…" gap between page numbers. */
type PageSlot = number | null;

/** Previous / next buttons with a compact list of page numbers. Hidden when there is one page. */
@Component({
  selector: 'app-pagination',
  templateUrl: './pagination.html',
  styleUrl: './pagination.scss',
})
export class Pagination {
  /** 1-based. */
  readonly page = input.required<number>();
  readonly totalPages = input.required<number>();
  readonly disabled = input(false);

  readonly pageChange = output<number>();

  protected readonly slots = computed(() => pageSlots(this.page(), this.totalPages()));

  protected go(page: number): void {
    if (page >= 1 && page <= this.totalPages() && page !== this.page()) {
      this.pageChange.emit(page);
    }
  }
}

/** First, last and two neighbours of the current page: 1 … 4 5 [6] 7 8 … 20 */
function pageSlots(current: number, total: number): PageSlot[] {
  const pages = new Set([1, total]);
  for (let page = current - 2; page <= current + 2; page++) {
    if (page >= 1 && page <= total) {
      pages.add(page);
    }
  }

  const sorted = [...pages].sort((a, b) => a - b);
  return sorted.flatMap((page, i) => (i > 0 && page - sorted[i - 1] > 1 ? [null, page] : [page]));
}
