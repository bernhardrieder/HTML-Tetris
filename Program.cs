using System.IO;
using System.Net;
using Microsoft.AspNetCore.Hosting;
using System;

namespace Backend
{
    class Program
    {
        static void Main(string[] args)
        {
           var host = new WebHostBuilder()
                .UseKestrel(options =>
                {
                    options.Listen(IPAddress.Any, 5000);
                })
                .UseContentRoot(Directory.GetCurrentDirectory())
                .UseStartup<Startup>()
                .Build();
            host.Run();
        }
    }
}
