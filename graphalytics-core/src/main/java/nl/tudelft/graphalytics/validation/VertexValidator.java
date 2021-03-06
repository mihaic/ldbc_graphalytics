/*
 * Copyright 2015 Delft University of Technology
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *         http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
package nl.tudelft.graphalytics.validation;

import java.io.BufferedReader;
import java.io.FileReader;
import java.io.IOException;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.ArrayList;
import java.util.Collections;
import java.util.HashMap;
import java.util.Map;

import org.apache.logging.log4j.LogManager;
import org.apache.logging.log4j.Logger;

import nl.tudelft.graphalytics.validation.rule.ValidationRule;

/**
 * Class takes the output file generated by a platform for specific algorithm and the reference output for this algorithm.
 * Both files should be in graphalytics vertex file format. The values of the vertices are validate using the given validation
 * rule.
 *
 * @param <E> The type of the validation rule used.
 */
public class VertexValidator<E> {
	private static final Logger LOG = LogManager.getLogger(VertexValidator.class);
	private static final long MAX_PRINT_ERROR_COUNT = 100;

	final private Path outputPath;
	final private Path validationFile;
	final private ValidationRule<E> rule;
	final private boolean verbose;

	public VertexValidator(Path outputPath, Path validationFile, ValidationRule<E> rule, boolean verbose) {
		this.outputPath = outputPath;
		this.validationFile = validationFile;
		this.rule = rule;
		this.verbose = verbose;
	}

	public boolean execute() throws ValidatorException {
		Map<Long, E> validationResults, outputResults;

		if (verbose) {
			LOG.info("Validating contents of '" + outputPath + "'...");
		}

		try {
			validationResults = parseFile(validationFile);
		} catch (IOException e) {
			throw new ValidatorException("Failed to read validation file '" + validationFile + "'");
		}

		try {
			outputResults = parseFileOrDirectory(outputPath);
		} catch (IOException e) {
			throw new ValidatorException("Failed to read output file/directory '" + outputPath + "'");
		}

		ArrayList<Long> keys = new ArrayList<Long>();
		keys.addAll(validationResults.keySet());
		keys.addAll(outputResults.keySet());
		Collections.sort(keys);

		long errorsCount = 0;

		long missingVertices = 0;
		long unknownVertices = 0;
		long incorrectVertices = 0;
		long correctVertices = 0;

		long prevId = -1;
		for (Long id: keys) {

			// Keep track of previous ID to skip duplicate IDs. Since the
			// list of vertex IDs is sorted, duplicate IDs will be continuous.
			if (prevId == id) {
				continue;
			} else {
				prevId = id;
			}


			String error = null;
			E outputValue = outputResults.get(id);
			E correctValue = validationResults.get(id);

			if (outputValue == null) {
				missingVertices++;
				error = "Vertex " + id + " is missing";
			} else if (correctValue == null) {
				unknownVertices++;
				error = "Vertex " + id + " is not a valid vertex";
			} else if (!rule.match(outputValue, correctValue)) {
				incorrectVertices++;
				error = "Vertex " + id + " has value '" + outputValue + "', but valid value is '" + correctValue + "'";
			} else {
				correctVertices++;
			}

			if (error != null) {
				if (verbose && errorsCount < MAX_PRINT_ERROR_COUNT) {
					LOG.info(" - " + error);
				}

				errorsCount++;
			}
		}

		if (errorsCount >= MAX_PRINT_ERROR_COUNT) {
			LOG.info(" - [" + (errorsCount - MAX_PRINT_ERROR_COUNT) + " errors have been omitted] ");
		}

		if (errorsCount > 0) {
			LOG.info("Validation failed");

			long totalVertices = correctVertices + incorrectVertices + missingVertices;

			LOG.info(String.format(" - Correct vertices: %d (%.2f%%)",
					correctVertices, (100.0 * correctVertices) / totalVertices));
			LOG.info(String.format(" - Incorrect vertices: %d (%.2f%%)",
					incorrectVertices, (100.0 * incorrectVertices) / totalVertices));
			LOG.info(String.format(" - Missing vertices: %d (%.2f%%)",
					missingVertices, (100.0 * missingVertices) / totalVertices));
			LOG.info(String.format(" - Unknown vertices: %d (%.2f%%)",
					unknownVertices, (100.0 * unknownVertices) / totalVertices));
		} else {
			LOG.info("Validation successful");
		}

		return errorsCount == 0;
	}

	private Map<Long, E> parseFile(Path file) throws IOException {
		HashMap<Long, E> results = new HashMap<Long, E>();

		try(BufferedReader reader = new BufferedReader(new FileReader(file.toFile()))) {
			String line;
			while ((line = reader.readLine()) != null) {
				line = line.trim();

				if (line.isEmpty()) {
					continue;
				}

				String[] parts = line.split("\\s+", 2);

				try {
					long vertexId = Long.parseLong(parts[0]);
					E vertexValue = rule.parse(parts.length > 1 ? parts[1] : "");
					results.put(vertexId,  vertexValue);
				} catch(Throwable e) {
					LOG.warn("Skipping invalid line '" + line + "' of file '" + file + "'");
				}
			}
		}

		return results;
	}

	private Map<Long, E> parseFileOrDirectory(Path filePath) throws IOException {
		final Map<Long, E> results = new HashMap<>();
		Files.walkFileTree(filePath, new SimpleFileVisitor<Path>() {
			@Override
			public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
				results.putAll(parseFile(file));
				return FileVisitResult.CONTINUE;
			}
		});
		return results;
	}
}
