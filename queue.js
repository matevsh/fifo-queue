class Queue {
    constructor(queueName) {
        this.queueName = queueName;
        this.initialState = { head: '', tail: '', queue: {}, length: 0 };

        void this.#resume();
    }

    async #resume() {
        const resumeQue = await this.#load();
        resumeQue || this.#save(this.initialState);
    }

    #save({queue, head, tail, length}) {
        const data = {queue, head, tail, length}

        const dataJSON = JSON.stringify(data);
        localforage.setItem(this.queueName, dataJSON);
    }

    async #load() {
        const dataJson = await localforage.getItem(this.queueName);
        return JSON.parse(dataJson);
    }

    async queue() {
        const data = await this.#load();
        return data;
    }

    async head() {
        const data = await this.#load();
        return data?.queue[data?.head];
    }

    async tail() {
        const data = await this.#load();
        return data?.queue[data?.tail];
    }

    async pushHead(value){
        // Pobieram dane localforage i tworzę stan do aktualizacji
        const lfData = await this.#load();
        const updatedData = {queue: {...lfData.queue}, head: '', tail: lfData.tail};

        const elementName = `element-${this.#generateId()}`;
        const newElement = { prev: '', value, next: '' };

        const nextElement = lfData.head;

        if(nextElement) {
            updatedData.queue[nextElement].prev = elementName;
            newElement.next = nextElement;
        } else {
            updatedData.tail = elementName;
        }

        updatedData.head = elementName;
        updatedData.length = lfData.length + 1;

        updatedData.queue[elementName] = newElement;

        this.#save({...updatedData});
        return newElement;
    }

    async popTail(){
        const lfData = await this.#load();
        if(!lfData.length) return;

        const updatedData = {...lfData}

        const popElementId = updatedData.tail;

        if(updatedData.length !== 1) {
            const newTailId = updatedData?.queue[popElementId].prev;
            updatedData.queue[newTailId].next = '';

            updatedData.tail = newTailId;
        } else {
            updatedData.tail = '';
            updatedData.head = '';
        }

        updatedData.length -= 1;
        const { [popElementId]: _deleted, ...updatedQueue } = lfData.queue;

        updatedData.queue = updatedQueue;
        this.#save(updatedData);

        return _deleted;
    }

    #generateId() {
        return crypto.randomUUID()
    }
}