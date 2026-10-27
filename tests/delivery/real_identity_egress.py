"""Fixed-destination TCP relay: original provider TLS remains end to end."""
import asyncio
import ipaddress
import socket

UPSTREAM = 'czdpamk9.eu-central.insforge.app'
PORT = 443


def validate_addresses(addresses):
    if not addresses or len(addresses) > 32:
        raise ValueError('Bounded provider addresses required')
    if any(not ipaddress.ip_address(value).is_global for value in addresses):
        raise ValueError('Provider must resolve to public addresses only')
    return list(dict.fromkeys(addresses))


async def serve():
    addresses = validate_addresses([a[4][0] for a in socket.getaddrinfo(
        UPSTREAM, PORT, socket.AF_INET, socket.SOCK_STREAM)])
    limit = asyncio.Semaphore(32)

    async def connection(reader, writer):
        upstream = None
        try:
            async with limit:
                remote_reader, upstream = await asyncio.wait_for(
                    asyncio.open_connection(addresses[0], PORT), 15)

                async def pipe(source, target):
                    while True:
                        chunk = await asyncio.wait_for(source.read(65536), 45)
                        if not chunk:
                            break
                        target.write(chunk)
                        await target.drain()

                tasks = [asyncio.create_task(pipe(reader, upstream)),
                         asyncio.create_task(pipe(remote_reader, writer))]
                try:
                    await asyncio.wait(tasks, return_when=asyncio.FIRST_COMPLETED)
                finally:
                    for task in tasks:
                        task.cancel()
                    await asyncio.gather(*tasks, return_exceptions=True)
        except (OSError, TimeoutError):
            pass  # Never log TLS payloads, credentials or request URLs.
        finally:
            writer.close()
            if upstream is not None:
                upstream.close()

    server = await asyncio.start_server(connection, '0.0.0.0', PORT, limit=65536)
    async with server:
        await server.serve_forever()


if __name__ == '__main__':
    asyncio.run(serve())
