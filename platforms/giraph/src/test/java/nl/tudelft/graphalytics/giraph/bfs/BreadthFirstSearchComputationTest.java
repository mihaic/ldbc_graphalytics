package nl.tudelft.graphalytics.giraph.bfs;

import nl.tudelft.graphalytics.giraph.AbstractComputationTest;
import org.apache.giraph.conf.GiraphConfiguration;
import org.apache.giraph.utils.TestGraph;
import org.apache.hadoop.io.LongWritable;
import org.apache.hadoop.io.NullWritable;
import org.junit.Test;

import static org.hamcrest.MatcherAssert.assertThat;
import static org.hamcrest.Matchers.*;

/**
 * Test class for the breadth-first search algorithm. Executes the Giraph implementation of the BFS computation on a
 * small graph, and verifies that the output of the computation matches the expected results.
 *
 * @author Tim Hegeman
 */
public class BreadthFirstSearchComputationTest extends AbstractComputationTest<LongWritable, NullWritable> {

	@Test
	public void testExample() throws Exception {
		GiraphConfiguration configuration = new GiraphConfiguration();
		configuration.setComputationClass(BreadthFirstSearchComputation.class);
		BreadthFirstSearchConfiguration.SOURCE_VERTEX.set(configuration, 1);

		TestGraph<LongWritable, LongWritable, NullWritable> result =
				runTest(configuration, "/test-examples/bfs-input");
		TestGraph<LongWritable, LongWritable, NullWritable> expected =
				parseGraphValues(configuration, "/test-examples/bfs-output");

		assertThat("result graph has the correct number of vertices",
				result.getVertices().keySet(), hasSize(expected.getVertices().size()));
		for (LongWritable vertexId : result.getVertices().keySet())
			assertThat("vertex " + vertexId + " has correct value",
					result.getVertex(vertexId).getValue(), is(equalTo(expected.getVertex(vertexId).getValue())));
	}

	@Override
	protected LongWritable getDefaultValue(long vertexId) {
		return new LongWritable(Long.MAX_VALUE);
	}

	@Override
	protected NullWritable getDefaultEdgeValue(long sourceId, long destinationId) {
		return NullWritable.get();
	}

	@Override
	protected LongWritable parseValue(long vertexId, String value) {
		return new LongWritable(Long.parseLong(value));
	}
}