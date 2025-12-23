export class AsyncPager<T> {
    private iterator: AsyncIterator<T>;

    constructor(
        iterable: AsyncIterable<T>,
        private pages: T[] = [],
        private pagePointer = -1,
        private isDone = false
    ) {
        this.iterator = iterable[Symbol.asyncIterator]();
    }

    /**
     * Move to a specific page
     */
    async goTo(page: number): Promise<T> {
        if (page < 0) {
            page = 0;
        }

        if (page >= this.pages.length) {
            while (page >= this.pages.length) {
                if (this.isDone) {
                    break;
                }

                const next = await this.iterator.next();

                if (next.done) {
                    this.isDone = true;
                } else {
                    this.pages.push(next.value);
                }
            }
        }

        this.pagePointer = page - 1;

        return this.next();
    }

    /**
     * Provides access to the current page of values
     */
    async current(): Promise<T> {
        // we don't have any pages yet
        if (this.pagePointer < 0) {
            return this.next();
        }

        // return the current page
        return this.pages[this.pagePointer];
    }

    /**
     * Access the next page, either from the local cache or make a request to load it
     */
    async next(): Promise<T> {
        // does the page exist?
        const page = this.pages[++this.pagePointer];

        if (typeof page === "undefined") {
            if (this.isDone) {
                // if we are already done make sure we don't make any more requests
                // and return the last page
                --this.pagePointer;
            } else {
                // get the next page of links
                const next = await this.iterator.next();

                if (next.done) {
                    this.isDone = true;
                } else {
                    this.pages.push(next.value);
                }
            }
        }

        return this.pages[this.pagePointer];
    }

    async prev(): Promise<T> {
        // handle already at the start
        if (this.pagePointer < 1) {
            return this.pages[0];
        }

        // return the previous page moving our pointer
        return this.pages[--this.pagePointer];
    }
}
