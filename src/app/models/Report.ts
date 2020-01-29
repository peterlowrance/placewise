export interface Report {
    item: {
        ID: number,
        name: string,
        imageUrl: string
    },
    reportDate: string,
    reporter: string,
    description: string
}
