import React, { useState } from "react";

const LogbookPage = () => {
  const [selectedHike, setSelectedHike] = useState(null);
  const [search, setSearch] = useState("");

  const hikes = [
    { id: 1, name: "Hike 1", description: "Scenic trail with waterfalls." },
    { id: 2, name: "Hike 2", description: "Mountain trail with steep climbs." },
    { id: 3, name: "Hike 3", description: "Forest walk with wildlife." },
    { id: 4, name: "Hike 4", description: "Coastal path with ocean views." },
    { id: 5, name: "Hike 5", description: "Short easy hike near the city." },
    { id: 6, name: "Hike 6", description: "Challenging long-distance trail." }
  ];

  const filteredHikes = hikes.filter(h =>
    h.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="pt-20 p-6 flex flex-col items-center">
      {/* Header */}
      <header className="mb-6">
        <h1 className="text-3xl font-bold">Logbook</h1>
      </header>

      <section className="flex flex-row gap-6 w-full max-w-6xl">
        {/* Main Content */}
        <section className="flex flex-col flex-1 items-center">
          {/* Search */}
          <form className="flex items-center justify-between gap-2 w-full mb-2">
            <label htmlFor="search" className="font-medium">
              Search:
            </label>
            <input
              id="search"
              type="text"
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search hikes..."
              className="flex-1 border px-2 py-1 rounded"
            />
          </form>

          {/* Map */}
          <section
            aria-label="Map"
            className="flex justify-center items-center border w-full h-[400px] mb-6"
          >
            MAP
          </section>

          {/* Details */}
          <section
            aria-label="Details"
            className="flex justify-center items-center border w-4/5 h-[100px] p-4 text-center"
          >
            {selectedHike ? (
              <p>{selectedHike.description}</p>
            ) : (
              <p>Details will appear here</p>
            )}
          </section>
        </section>

        {/* Sidebar */}
        <aside className="flex flex-col gap-4 w-1/4">
          {/* Hikes Button */}
          <button className="border py-2 px-4">Hikes</button>

          {/* Hike List */}
          <nav
            aria-label="Hike list"
            className="border flex flex-col divide-y"
          >
            {filteredHikes.length > 0 ? (
              filteredHikes.map(hike => (
                <button
                  key={hike.id}
                  onClick={() => setSelectedHike(hike)}
                  className={`p-2 text-left hover:bg-gray-100 ${
                    selectedHike?.id === hike.id ? "bg-green-100" : ""
                  }`}
                >
                  {hike.name}
                </button>
              ))
            ) : (
              <p className="p-2 text-gray-500">No hikes found</p>
            )}
          </nav>

          {/* Big Button */}
          <button
            onClick={() => alert("Button clicked!")}
            className="bg-green-500 text-white text-lg font-semibold py-4 rounded-xl hover:bg-green-600"
          >
            Button
          </button>
        </aside>
      </section>
    </main>
  );
};

export default LogbookPage;
