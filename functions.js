export function arrayContainsValue(array, value) {
    for (let i = 0; i < array.length; i++) {
        if (array[i] === value) {
            return true
        }
    }
    return false;
}

export function ListOfObjectContainsValue(listOFObjects, value, field) {
    for (let i = 0; i < list.length; i++) {
        if (listOFObjects[i].field === value) {
            return i
        }
    }
    return false;
}