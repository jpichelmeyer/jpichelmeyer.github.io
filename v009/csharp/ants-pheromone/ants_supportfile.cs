// csharp-src/ants-pheromone/ants_supportfile.cs
//
// The simulation itself -- deliberately kept free of any Blazor/UI
// dependency, so it's just plain C# you could unit test or reuse
// elsewhere. ants_view_supportfile.razor is the only thing that knows
// this class exists.
//
// The model: each cell on the grid can carry a player-set "bias"
// arrow (the hormone/scent vector field you asked for -- edited while
// paused, never decays on its own). Ants also lay down their own
// pheromone trail as they carry food home, which evaporates over
// time -- that's the stigmergy: no ant plans a route, they just leave
// a trace that nudges the next ant's odds, and a path emerges.

using System;
using System.Collections.Generic;

namespace AntsPheromoneSim
{
    /// <summary>
    /// The 8 compass directions a cell's bias arrow can point, plus
    /// "no bias" (ants there act on pheromone + randomness alone).
    /// </summary>
    public enum BiasDirection
    {
        None, N, NE, E, SE, S, SW, W, NW
    }

    public static class BiasVectors
    {
        public static (int dx, int dy) ToVector(BiasDirection dir) => dir switch
        {
            BiasDirection.N  => (0, -1),
            BiasDirection.NE => (1, -1),
            BiasDirection.E  => (1, 0),
            BiasDirection.SE => (1, 1),
            BiasDirection.S  => (0, 1),
            BiasDirection.SW => (-1, 1),
            BiasDirection.W  => (-1, 0),
            BiasDirection.NW => (-1, -1),
            _ => (0, 0),
        };

        // The order a cell's arrow cycles through each time it's clicked.
        public static BiasDirection Next(BiasDirection dir) =>
            (BiasDirection)(((int)dir + 1) % 9);
    }

    public class Ant
    {
        public int X, Y;
        public bool CarryingFood;

        public Ant(int x, int y)
        {
            X = x;
            Y = y;
            CarryingFood = false;
        }
    }

    /// <summary>
    /// The whole simulation: a grid of player-painted bias vectors, a
    /// self-organizing pheromone trail the ants lay down themselves, a
    /// nest, a handful of food clusters, and the ants that wander
    /// between them.
    /// </summary>
    public class SimGrid
    {
        public readonly int Width, Height;
        public readonly BiasDirection[,] Bias;
        public readonly double[,] Pheromone;
        public readonly int[,] Food;
        public readonly int NestX, NestY;
        public readonly List<Ant> Ants = new();

        public int FoodDelivered { get; private set; }
        public int Tick { get; private set; }

        private readonly Random _rng = new();
        private const double EvaporationRate = 0.985;
        private const double DepositAmount = 1.0;

        public SimGrid(int width, int height, int antCount = 24)
        {
            Width = width;
            Height = height;
            Bias = new BiasDirection[width, height];
            Pheromone = new double[width, height];
            Food = new int[width, height];

            NestX = width / 2;
            NestY = height / 2;

            // A few food clusters scattered around the nest.
            for (int cluster = 0; cluster < 3; cluster++)
            {
                int cx = _rng.Next(width);
                int cy = _rng.Next(height);
                for (int i = 0; i < 6; i++)
                {
                    int fx = Math.Clamp(cx + _rng.Next(-2, 3), 0, width - 1);
                    int fy = Math.Clamp(cy + _rng.Next(-2, 3), 0, height - 1);
                    Food[fx, fy] += _rng.Next(3, 8);
                }
            }

            for (int i = 0; i < antCount; i++)
                Ants.Add(new Ant(NestX, NestY));
        }

        /// <summary>Called by the UI when the player clicks a cell while paused.</summary>
        public void ToggleBiasAt(int x, int y)
        {
            if (x < 0 || x >= Width || y < 0 || y >= Height) return;
            Bias[x, y] = BiasVectors.Next(Bias[x, y]);
        }

        /// <summary>Advances the whole colony by one tick.</summary>
        public void Step()
        {
            Tick++;

            for (int x = 0; x < Width; x++)
                for (int y = 0; y < Height; y++)
                    Pheromone[x, y] = Pheromone[x, y] > 0.001 ? Pheromone[x, y] * EvaporationRate : 0;

            foreach (var ant in Ants)
                StepAnt(ant);
        }

        private void StepAnt(Ant ant)
        {
            if (ant.CarryingFood)
                Pheromone[ant.X, ant.Y] += DepositAmount;

            if (ant.CarryingFood && ant.X == NestX && ant.Y == NestY)
            {
                ant.CarryingFood = false;
                FoodDelivered++;
            }

            if (!ant.CarryingFood && Food[ant.X, ant.Y] > 0)
            {
                Food[ant.X, ant.Y]--;
                ant.CarryingFood = true;
            }

            (ant.X, ant.Y) = ChooseMove(ant);
        }

        // Weighs each of the 8 neighbors by: the player's bias field,
        // a direct pull toward the nest when carrying food, the
        // pheromone trail when foraging, and a little randomness so
        // the colony can still explore on its own.
        private (int, int) ChooseMove(Ant ant)
        {
            var candidates = new List<(int x, int y, double weight)>();

            for (int dx = -1; dx <= 1; dx++)
            {
                for (int dy = -1; dy <= 1; dy++)
                {
                    if (dx == 0 && dy == 0) continue;
                    int nx = ant.X + dx, ny = ant.Y + dy;
                    if (nx < 0 || nx >= Width || ny < 0 || ny >= Height) continue;

                    double weight = 0.15 + _rng.NextDouble() * 0.3;

                    var (bx, by) = BiasVectors.ToVector(Bias[ant.X, ant.Y]);
                    if (bx == dx && by == dy) weight += 1.2;

                    if (ant.CarryingFood)
                    {
                        int hdx = Math.Sign(NestX - ant.X);
                        int hdy = Math.Sign(NestY - ant.Y);
                        if (dx == hdx && dy == hdy) weight += 0.8;
                    }
                    else
                    {
                        weight += Pheromone[nx, ny] * 0.6;
                    }

                    candidates.Add((nx, ny, weight));
                }
            }

            if (candidates.Count == 0) return (ant.X, ant.Y);

            double total = 0;
            foreach (var c in candidates) total += c.weight;
            double roll = _rng.NextDouble() * total;
            double running = 0;
            foreach (var c in candidates)
            {
                running += c.weight;
                if (roll <= running) return (c.x, c.y);
            }
            return (candidates[^1].x, candidates[^1].y);
        }
    }
}
