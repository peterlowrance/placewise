import { Item } from './Item';
import { HierarchyItem } from './HierarchyItem';
import { SentReport } from './SentReport';

export const LOCATIONS: HierarchyItem[] = [
{
    ID: 'root',
    name: 'root',
    parent: null,
    children: [
        '100',
        '200'
    ],
    items: [],
    imageUrl: null
},
{
    ID: '100',
    name: 'Building1',
    parent: 'root',
    children: ['110'],
    items: [],
    imageUrl: 'crouton.png'
},
{
    ID: '200',
    name: 'Building2',
    parent: 'root',
    children: [
        '210'
    ],
    items: ['998'],
    imageUrl: 'crouton.png'
},
{
    ID: '110',
    name: 'Building1Room1',
    parent: '100',
    children: ['111'],
    items: ['999','998'],
    imageUrl: 'crouton.png'
},
{
    ID: '210',
    name: 'Building2Room1',
    parent: '200',
    children: [],
    items: ['997'],
    imageUrl: 'crouton.png'
},
{
    ID: '111',
    name: 'Building1Room1Desk1',
    parent: '110',
    children: [],
    items: ['997'],
    imageUrl: 'crouton.png'
}
];

export const ITEMS: Item[] = [
    {
        ID: '999',
        name: 'Niner',
        desc: 'A big ol boy',
        tags: ['Round','High'],
        locations: ['110'],
        category: '554',
        imageUrl: 'crouton.png'
    },
    {
        ID: '998',
        name: 'An 8',
        desc: 'Had to be different?',
        tags: ['Hated'],
        locations: ['110','200'],
        category: '553',
        imageUrl: 'crouton.png'
    },
    {
        ID: '997',
        name: 'Smaller',
        desc: 'Oh wee bab',
        tags: [],
        locations: ['111','210'],
        category: '554',
        imageUrl: 'crouton.png'
    }
]

export const CATEGORIES: HierarchyItem[] = [
{
    ID: '555',
    name: 'root',
    parent: null,
    children: [
        '554',
        '553'
    ],
    items: [],
    imageUrl: null
},
{
    ID: '554',
    name: 'numbers',
    parent: null,
    children: [],
    items: ['997','999'],
    imageUrl: 'crouton.png'
},
{
    ID: '553',
    name: 'letters?',
    parent: null,
    children: [],
    items: ['998'],
    imageUrl: 'crouton.png'
}
]

export const REPORTS: SentReport[] = [
    {
        item: '999',
        desc: 'This is problematic',
        user: "111",
        ID: '000',
        trueItem: null,
        userName: ""
    },
    {
        item: '998',
        desc: 'Send help',
        user: "112",
        ID: '001',
        trueItem: null,
        userName: ""
    },
    {
        item: '998',
        desc: 'The item can see into my soul',
        user: "113",
        ID: '002',
        trueItem: null,
        userName: ""
    }
    ]