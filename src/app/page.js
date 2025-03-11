import { redirect } from "next/navigation"

export default function Home() {
  // redirect('/api/')

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <div className="z-10 max-w-5xl w-full text-center font-mono text-sm lg:flex">
        Como mayor aportador <b>PANI</b>, como segundo mejor aportador <b>JUAN</b>, como tercer mejor aportador <b>MIGUE</b>, como cuarto mejor aportador <b>ANGEL</b>, y como último <b>JOSE</b>, que es el que menos ha hecho.
      </div>
    </main>
  )
}