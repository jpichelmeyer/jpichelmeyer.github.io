// csharp-src/ants-pheromone/ants_program.cs
//
// Blazor WebAssembly's entry point. This is the C# analogue of the
// project_name_program.cs / static void Main() format -- but note
// what it does and doesn't do: unlike the Python terminal projects,
// this Main() does NOT run the simulation itself. Blazor is a UI
// framework, not a terminal emulator, so Main() only boots the
// framework and hands the page over to a component. All the actual
// game logic lives in plain C# in ants_supportfile.cs; the only thing
// that isn't a .cs file is the small Razor view that renders it
// (ants_view_supportfile.razor) -- Blazor has no way around that part.

using System.Threading.Tasks;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;

namespace AntsPheromoneSim
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebAssemblyHostBuilder.CreateDefault(args);
            builder.RootComponents.Add<AntsView>("#app");
            await builder.Build().RunAsync();
        }
    }
}
