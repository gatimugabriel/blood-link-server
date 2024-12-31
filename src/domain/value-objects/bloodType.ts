export enum BloodType{
    A_POSITIVE = "A+",
    A_NEGATIVE = "A-",
    B_POSITIVE = "B+",
    B_NEGATIVE = "B-",
    AB_POSITIVE = "AB+",
    AB_NEGATIVE = "AB-",
    O_POSITIVE = "O+",
    O_NEGATIVE = "O-"
}

export class BloodGroup {
    private readonly value: BloodType;

    constructor(value: BloodType) {
        if (!this.isValidBloodType(value)) {
            throw new Error("Invalid blood type");
        }
        this.value = value;
    }

    private isValidBloodType(value: BloodType): boolean {
        return Object.values(BloodType).includes(value);
    }

    getValue(): BloodType {
        return this.value;
    }
}
