# Build Stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY ["AnaliseFalhasDotNet.csproj", "./"]
RUN dotnet restore "AnaliseFalhasDotNet.csproj"
COPY . .
RUN dotnet publish "AnaliseFalhasDotNet.csproj" -c Release -o /app/publish

# Runtime Stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .

# Install cultures and timezone info if needed
RUN apt-get update && apt-get install -y --no-install-recommends tzdata

ENV TZ=America/Sao_Paulo
EXPOSE 8080

ENTRYPOINT ["dotnet", "AnaliseFalhasDotNet.dll"]
