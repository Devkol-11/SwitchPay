export interface IEvent {
        eventName: string;
        occurredAt: Date;
        data: Record<string, any>;
}

export abstract class BaseEvent implements IEvent {
        public readonly occurredAt: Date;
        public abstract readonly eventName: string;

        constructor(public readonly data: Record<string, any>) {
                this.occurredAt = new Date();
        }
        getPayload() {
                return {
                        eventName: this.eventName,
                        occurredAt: this.occurredAt,
                        data: this.data
                };
        }
}
