import type {Metadata} from 'next'
import {DualOrbLab} from '@/features/redesign/lab/DualOrbLab'

export const metadata:Metadata={title:'Prueba de orbes',robots:{index:false,follow:false}}
export default function OrbLabPage(){return <DualOrbLab/>}
