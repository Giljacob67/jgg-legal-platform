/**
 * Executa items em lotes de `concurrency` paralelas.
 * Útil para processar N documentos sem sobrecarregar conexões de banco/IA.
 * Erros são logados mas não travam o processamento dos demais items.
 *
 * @example
 * const results = await parallelMap(docs, 5, (doc) => processarDocumentoJuridico(doc));
 */
export async function parallelMap<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T, index: number) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length);

  for (let i = 0; i < items.length; i += concurrency) {
    const chunk = items.slice(i, i + concurrency);
    const chunkResults = await Promise.allSettled(
      chunk.map((item, ci) => fn(item, i + ci)),
    );

    for (let j = 0; j < chunkResults.length; j++) {
      const result = chunkResults[j];
      if (result.status === "fulfilled") {
        results[i + j] = result.value;
      } else {
        console.error("[parallel] item rejeitado:", result.reason);
      }
    }
  }

  return results;
}
