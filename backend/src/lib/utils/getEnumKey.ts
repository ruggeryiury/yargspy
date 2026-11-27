export const getEnumKey = <T extends Record<string, number>>(obj: T, value: T[keyof T]): keyof T | '' => {
	return (Object.keys(obj).find((key) => obj[key] === value) as keyof T | undefined) ?? ''
}
