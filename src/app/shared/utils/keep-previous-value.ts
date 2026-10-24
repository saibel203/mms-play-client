import { Resource, WritableSignal, linkedSignal } from '@angular/core';

/**
 * The last value a resource produced. A resource drops its value whenever its params change,
 * which blanks a list for the duration of every request (page 2 → 3, a new filter…);
 * this keeps showing the previous value until the next one arrives, and survives errors too.
 *
 * Writable, so a store can patch it optimistically (e.g. remove a deleted row) before the
 * server confirms; the next value from the resource replaces the patch.
 */
export function keepPreviousValue<T>(
  resource: Resource<T | undefined>,
): WritableSignal<T | undefined> {
  return linkedSignal<T | undefined, T | undefined>({
    source: () => (resource.hasValue() ? resource.value() : undefined),
    computation: (value, previous) => value ?? previous?.value,
  });
}
